import React, {
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { ChevronDown, EyeOff, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    useAcceptOnboardingRules,
    useCategories,
    useChannels,
    useCompleteOnboarding,
    useOnboarding,
    useRoles,
    useUpdateChannelPreferences,
    useUpdateSelfRoles,
} from '@/api/servers/servers.queries';
import type { Category, Channel, Role } from '@/api/servers/servers.types';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedChannelId } from '@/store/slices/navSlice';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { Text } from '@/ui/components/common/Text';
import { ChannelIcon } from '@/ui/components/servers/ChannelIcon';
import { cn } from '@/utils/cn';

const sortByPosition = <T extends { position: number }>(items: T[]): T[] =>
    [...items].sort((a, b) => a.position - b.position);

const channelIcon = (channel: Channel): React.ReactNode => (
    <ChannelIcon
        className="h-4 w-4 text-muted-foreground"
        emoji={channel.emoji}
        emojiType={channel.emojiType}
        icon={channel.icon}
        type={channel.type}
    />
);

const CORNER_R = 6;

export function drawChannelSplines(
    svg: SVGSVGElement,
    stage: HTMLElement,
    categoryEl: HTMLElement | null,
    channelEls: Array<HTMLElement | null>,
): void {
    const categoryRect = categoryEl?.getBoundingClientRect();
    if (!categoryRect) {
        svg.replaceChildren();
        return;
    }

    const stageRect = stage.getBoundingClientRect();
    const fx = categoryRect.left - stageRect.left + 14;
    const fy = categoryRect.bottom - stageRect.top;
    const paths: SVGPathElement[] = [];

    for (const channelEl of channelEls) {
        const channelRect = channelEl?.getBoundingClientRect();
        if (!channelRect) continue;

        const tx = channelRect.left - stageRect.left;
        const ty = channelRect.top - stageRect.top + channelRect.height / 2;
        const dy = ty - fy;
        const dx = tx - fx;
        const r = Math.min(CORNER_R, dy, Math.max(0, dx));
        const d =
            r > 0
                ? `M ${fx} ${fy} L ${fx} ${ty - r} A ${r} ${r} 0 0 0 ${
                      fx + r
                  } ${ty} L ${tx} ${ty}`
                : `M ${fx} ${fy} L ${fx} ${ty} L ${tx} ${ty}`;

        const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
        );
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'var(--color-checklist-spine)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linecap', 'round');
        paths.push(path);
    }

    svg.replaceChildren(...paths);
}

export const RolePicker: React.FC<{
    roles: Role[];
    allowedRoleIds: string[];
    selectedRoleIds: string[];
    onChange: (roleIds: string[]) => void;
}> = ({ roles, allowedRoleIds, selectedRoleIds, onChange }) => {
    const allowed = new Set(allowedRoleIds);
    const selected = new Set(selectedRoleIds);
    const availableRoles = sortByPosition(
        roles.filter((role) => allowed.has(role._id)),
    );

    const toggleRole = (roleId: string): void => {
        const next = new Set(selected);
        if (next.has(roleId)) {
            next.delete(roleId);
        } else {
            next.add(roleId);
        }
        onChange([...next].filter((id) => allowed.has(id)));
    };

    if (availableRoles.length === 0) {
        return (
            <Text as="p" size="sm" variant="muted">
                This server has not configured any self-assignable roles.
            </Text>
        );
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {availableRoles.map((role) => {
                const isSelected = selected.has(role._id);
                return (
                    <button
                        className={cn(
                            'flex w-full flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                            isSelected
                                ? 'border-primary bg-primary/10'
                                : 'hover:border-border border-border-subtle bg-bg-subtle hover:bg-bg-secondary/60',
                        )}
                        key={role._id}
                        type="button"
                        onClick={() => toggleRole(role._id)}
                    >
                        <div className="flex items-center gap-2">
                            <RoleDot role={role} />
                            <span
                                className={cn(
                                    'truncate text-sm font-medium',
                                    isSelected
                                        ? 'text-primary'
                                        : 'text-foreground',
                                )}
                            >
                                {role.name}
                            </span>
                        </div>
                        {role.description && (
                            <p
                                className={cn(
                                    'line-clamp-2 text-xs leading-relaxed',
                                    isSelected
                                        ? 'text-primary/70'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {role.description}
                            </p>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

interface ServerSelfRolesModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

export const ServerSelfRolesModal: React.FC<ServerSelfRolesModalProps> = ({
    isOpen,
    onClose,
    serverId,
}) => {
    const { data: onboarding } = useOnboarding(serverId, { enabled: isOpen });
    const { data: roles } = useRoles(serverId, { enabled: isOpen });
    const updateSelfRoles = useUpdateSelfRoles(serverId);
    const allowedRoleIds = onboarding?.onboarding.selfAssignableRoleIds ?? [];
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    React.useEffect(() => {
        if (!onboarding) return;
        const allowed = new Set(onboarding.onboarding.selfAssignableRoleIds);
        setSelectedRoleIds(
            onboarding.member.roles.filter((roleId) => allowed.has(roleId)),
        );
    }, [onboarding]);

    const handleSave = (): void => {
        updateSelfRoles.mutate(selectedRoleIds, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal fullScreen isOpen={isOpen} title="Roles" onClose={onClose}>
            {!onboarding || !roles ? (
                <div className="flex min-h-40 items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="mx-auto max-w-3xl space-y-5">
                    <Text as="p" variant="muted">
                        Pick the roles you want in this server.
                    </Text>
                    <RolePicker
                        allowedRoleIds={allowedRoleIds}
                        roles={roles}
                        selectedRoleIds={selectedRoleIds}
                        onChange={setSelectedRoleIds}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            loading={updateSelfRoles.isPending}
                            variant="primary"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const ChannelPreferenceGroup: React.FC<{
    category: Category | null;
    channels: Channel[];
    hiddenCategories: Set<string>;
    hiddenChannels: Set<string>;
    onToggleCategory: (categoryId: string) => void;
    onToggleChannel: (channelId: string) => void;
}> = ({
    category,
    channels,
    hiddenCategories,
    hiddenChannels,
    onToggleCategory,
    onToggleChannel,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const stageRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const categoryRef = useRef<HTMLButtonElement>(null);
    const channelRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const redraw = useCallback(() => {
        if (!svgRef.current || !stageRef.current || !isOpen) return;
        drawChannelSplines(
            svgRef.current,
            stageRef.current,
            categoryRef.current,
            channelRefs.current,
        );
    }, [isOpen]);

    useLayoutEffect(() => {
        let frame = 0;
        let secondFrame = 0;

        const drawAfterLayout = (): void => {
            frame = window.requestAnimationFrame(() => {
                secondFrame = window.requestAnimationFrame(redraw);
            });
        };

        drawAfterLayout();
        const stage = stageRef.current;
        if (!stage) return;
        const obs = new ResizeObserver(redraw);
        obs.observe(stage);
        for (const el of channelRefs.current) {
            if (el) obs.observe(el);
        }
        if (categoryRef.current) obs.observe(categoryRef.current);

        return () => {
            window.cancelAnimationFrame(frame);
            window.cancelAnimationFrame(secondFrame);
            obs.disconnect();
        };
    }, [redraw, channels.length]);

    React.useEffect(() => {
        if (!isOpen) svgRef.current?.replaceChildren();
    }, [isOpen]);

    const isCategoryHidden =
        category !== null && hiddenCategories.has(category._id);

    return (
        <div className="relative rounded-md border border-border-subtle bg-bg-secondary/40 p-2">
            <div className="relative" ref={stageRef}>
                <svg
                    aria-hidden="true"
                    ref={svgRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                />

                <Button
                    className={cn(
                        'relative z-content w-full justify-start rounded-md border-none px-2 py-1.5 text-left shadow-none',
                        isCategoryHidden
                            ? 'bg-warning/10 text-warning hover:bg-warning/15'
                            : 'bg-transparent text-foreground hover:bg-white/5',
                    )}
                    innerClassName="w-full justify-start"
                    ref={categoryRef}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                        if (category) {
                            onToggleCategory(category._id);
                        } else {
                            setIsOpen((value) => !value);
                        }
                    }}
                >
                    <ChevronDown
                        className={cn(
                            'shrink-0 text-muted-foreground transition-transform',
                            !isOpen && '-rotate-90',
                        )}
                        size={16}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen((value) => !value);
                        }}
                    />
                    <Folder
                        className="shrink-0 text-muted-foreground"
                        size={16}
                    />
                    <span className="min-w-0 flex-1 truncate">
                        {category?.name ?? 'Uncategorized'}
                    </span>
                    {isCategoryHidden && (
                        <EyeOff className="shrink-0" size={15} />
                    )}
                </Button>

                {isOpen && (
                    <div className="mt-1 space-y-1 pl-8">
                        {channels.map((channel, index) => {
                            const isHidden = hiddenChannels.has(channel._id);
                            return (
                                <Button
                                    className={cn(
                                        'relative z-content w-full justify-start rounded-md border-none px-2 py-1.5 text-left shadow-none',
                                        isHidden
                                            ? 'bg-warning/10 text-warning hover:bg-warning/15'
                                            : 'bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground',
                                    )}
                                    innerClassName="w-full justify-start"
                                    key={channel._id}
                                    ref={(el) => {
                                        channelRefs.current[index] = el;
                                    }}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onToggleChannel(channel._id)}
                                >
                                    {channelIcon(channel)}
                                    <span className="min-w-0 flex-1 truncate">
                                        {channel.name}
                                    </span>
                                    {isHidden && (
                                        <EyeOff
                                            className="shrink-0"
                                            size={15}
                                        />
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ChannelPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

export const ChannelPreferencesModal: React.FC<
    ChannelPreferencesModalProps
> = ({ isOpen, onClose, serverId }) => {
    const { data: onboarding } = useOnboarding(serverId, { enabled: isOpen });
    const { data: channels } = useChannels(serverId, { enabled: isOpen });
    const { data: categories } = useCategories(serverId, { enabled: isOpen });
    const updatePreferences = useUpdateChannelPreferences(serverId);
    const [hiddenChannelIds, setHiddenChannelIds] = useState<string[]>([]);
    const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);

    React.useEffect(() => {
        if (!onboarding) return;
        setHiddenChannelIds(onboarding.member.hiddenChannelIds ?? []);
        setHiddenCategoryIds(onboarding.member.hiddenCategoryIds ?? []);
    }, [onboarding]);

    const hiddenChannels = new Set(hiddenChannelIds);
    const hiddenCategories = new Set(hiddenCategoryIds);
    const groupedChannels = useMemo(() => {
        const sortedChannels = sortByPosition(channels ?? []);
        const sortedCategories = sortByPosition(categories ?? []);
        const categoryIds = new Set(sortedCategories.map((c) => c._id));
        return [
            {
                category: null,
                channels: sortedChannels.filter(
                    (channel) =>
                        !channel.categoryId ||
                        !categoryIds.has(channel.categoryId),
                ),
            },
            ...sortedCategories.map((category) => ({
                category,
                channels: sortedChannels.filter(
                    (channel) => channel.categoryId === category._id,
                ),
            })),
        ].filter((group) => group.category !== null || group.channels.length);
    }, [channels, categories]);

    const toggleId = (
        id: string,
        current: Set<string>,
        setter: (ids: string[]) => void,
    ): void => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setter([...next]);
    };

    const handleSave = (): void => {
        updatePreferences.mutate(
            { hiddenChannelIds, hiddenCategoryIds },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <Modal
            fullScreen
            isOpen={isOpen}
            title="Channels & Categories"
            onClose={onClose}
        >
            {!onboarding || !channels || !categories ? (
                <div className="flex min-h-40 items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="mx-auto max-w-4xl space-y-5">
                    <Text as="p" variant="muted">
                        Hide channels and categories you do not want in your
                        sidebar.
                    </Text>

                    <div className="space-y-3">
                        <Text weight="semibold">Sidebar Visibility</Text>
                        <div className="space-y-2">
                            {groupedChannels.map((group) => (
                                <ChannelPreferenceGroup
                                    category={group.category}
                                    channels={group.channels}
                                    hiddenCategories={hiddenCategories}
                                    hiddenChannels={hiddenChannels}
                                    key={group.category?._id ?? 'uncategorized'}
                                    onToggleCategory={(categoryId) =>
                                        toggleId(
                                            categoryId,
                                            hiddenCategories,
                                            setHiddenCategoryIds,
                                        )
                                    }
                                    onToggleChannel={(channelId) =>
                                        toggleId(
                                            channelId,
                                            hiddenChannels,
                                            setHiddenChannelIds,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            loading={updatePreferences.isPending}
                            variant="primary"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

interface ServerOnboardingModalProps {
    serverId: string;
}

export const ServerOnboardingModal: React.FC<ServerOnboardingModalProps> = ({
    serverId,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId);
    const { data: roles } = useRoles(serverId);
    const { data: channels } = useChannels(serverId);
    const acceptRules = useAcceptOnboardingRules(serverId);
    const updateSelfRoles = useUpdateSelfRoles(serverId);
    const completeOnboarding = useCompleteOnboarding(serverId);
    const [accepted, setAccepted] = useState(false);
    const [step, setStep] = useState<'rules' | 'roles' | 'welcome'>('rules');
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    const isRequired =
        onboarding?.member.onboardingRequired === true &&
        onboarding.member.onboardingCompletedAt == null;

    React.useEffect(() => {
        if (!onboarding) return;
        const allowed = new Set(onboarding.onboarding.selfAssignableRoleIds);
        setSelectedRoleIds(
            onboarding.member.roles.filter((roleId) => allowed.has(roleId)),
        );
        if (onboarding.member.rulesAcceptedAt) {
            setStep('roles');
            setAccepted(true);
        }
    }, [onboarding]);

    const rulesList = useMemo(
        () => onboarding?.onboarding.guidelines ?? [],
        [onboarding?.onboarding.guidelines],
    );

    if (!isRequired) return null;

    const handleAcceptRules = (): void => {
        acceptRules.mutate(undefined, {
            onSuccess: () => setStep('roles'),
        });
    };

    const handleRolesNext = (): void => {
        updateSelfRoles.mutate(selectedRoleIds, {
            onSuccess: () => setStep('welcome'),
        });
    };

    const handleFinish = (): void => {
        completeOnboarding.mutate(undefined, {
            onSuccess: () => {
                const landing =
                    onboarding?.onboarding.landingChannelId ||
                    onboarding?.onboarding.welcomeChannelIds[0] ||
                    channels?.find((channel) => channel.type !== 'link')?._id;
                if (landing) {
                    dispatch(setSelectedChannelId(landing));
                    void navigate(
                        `/chat/@server/${serverId}/channel/${landing}`,
                        { replace: true },
                    );
                }
            },
        });
    };

    const welcomeChannels = (channels ?? []).filter((channel) =>
        onboarding?.onboarding.welcomeChannelIds.includes(channel._id),
    );

    const steps: { id: 'rules' | 'roles' | 'welcome'; label: string }[] = [
        { id: 'rules', label: 'Server Rules' },
        { id: 'roles', label: 'Customize' },
        { id: 'welcome', label: 'Welcome' },
    ];
    const stepIndex = step === 'rules' ? 0 : step === 'roles' ? 1 : 2;

    return (
        <Modal
            fullScreen
            isOpen
            showCloseButton={false}
            title="Welcome to Server Onboarding"
            onClose={() => {}}
        >
            {!onboarding || !roles || !channels ? (
                <div className="flex min-h-40 items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="mx-auto max-w-3xl py-4">
                    {/* Step Indicator */}
                    <div className="mb-10">
                        <div className="flex items-center justify-center">
                            {steps.map((s, i) => {
                                const isActive = i === stepIndex;
                                const isCompleted = i < stepIndex;
                                return (
                                    <React.Fragment key={s.id}>
                                        {/* Step circle */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className={cn(
                                                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
                                                    isCompleted
                                                        ? 'border-primary bg-primary text-white'
                                                        : isActive
                                                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_4px] shadow-primary/20'
                                                          : 'border-border-subtle bg-bg-secondary text-muted-foreground',
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2.5}
                                                        viewBox="0 0 12 12"
                                                    >
                                                        <polyline points="1.5,6 4.5,9 10.5,3" />
                                                    </svg>
                                                ) : (
                                                    <span className="text-sm font-bold">
                                                        {i + 1}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-xs font-medium whitespace-nowrap transition-colors duration-300',
                                                    isActive
                                                        ? 'text-primary'
                                                        : isCompleted
                                                          ? 'text-muted-foreground'
                                                          : 'text-muted-foreground/50',
                                                )}
                                            >
                                                {s.label}
                                            </span>
                                        </div>

                                        {/* Connector line between steps */}
                                        {i < steps.length - 1 && (
                                            <div className="relative mx-3 mb-5 h-0.5 w-24 overflow-hidden rounded-full bg-border-subtle sm:w-32">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out"
                                                    style={{
                                                        width:
                                                            i < stepIndex
                                                                ? '100%'
                                                                : '0%',
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {step === 'rules' && (
                        <div className="space-y-6">
                            <div>
                                <Heading
                                    className="mb-1"
                                    level={2}
                                    variant="sub"
                                >
                                    Server Guidelines
                                </Heading>
                                <Text as="p" size="sm" variant="muted">
                                    Please review and agree to the rules before
                                    entering the server.
                                </Text>
                            </div>

                            {rulesList.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border-subtle bg-bg-secondary/20 p-6 text-center">
                                    <Text as="p" size="sm" variant="muted">
                                        No guidelines have been configured.
                                    </Text>
                                </div>
                            ) : (
                                <div className="custom-scrollbar max-h-[55vh] space-y-4 overflow-y-auto pr-2">
                                    {rulesList.map((rule, idx) => (
                                        <div
                                            className="hover:border-border flex gap-4 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4 transition-colors duration-200"
                                            key={idx}
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 pt-0.5">
                                                <Text className="text-sm leading-relaxed text-foreground">
                                                    {rule}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
                                <label
                                    className={cn(
                                        'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200',
                                        accepted
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:border-border border-border-subtle hover:bg-white/5',
                                    )}
                                >
                                    <input
                                        checked={accepted}
                                        className="sr-only"
                                        type="checkbox"
                                        onChange={(e) =>
                                            setAccepted(e.target.checked)
                                        }
                                    />
                                    <span
                                        className={cn(
                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
                                            accepted
                                                ? 'border-primary bg-primary'
                                                : 'border-border-subtle bg-transparent',
                                        )}
                                    >
                                        {accepted && (
                                            <svg
                                                className="h-3 w-3 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                                viewBox="0 0 12 12"
                                            >
                                                <polyline points="1.5,6 4.5,9 10.5,3" />
                                            </svg>
                                        )}
                                    </span>
                                    <Text className="text-sm font-medium text-foreground">
                                        I have read and agree to all server
                                        rules
                                    </Text>
                                </label>
                                <div className="flex justify-end">
                                    <Button
                                        className="w-full px-6 py-2.5 sm:w-auto"
                                        disabled={!accepted}
                                        loading={acceptRules.isPending}
                                        variant="primary"
                                        onClick={handleAcceptRules}
                                    >
                                        I've read and agree to rules
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'roles' && (
                        <div className="space-y-6">
                            <div>
                                <Heading
                                    className="mb-1"
                                    level={2}
                                    variant="sub"
                                >
                                    Pick Your Roles
                                </Heading>
                                <Text as="p" size="sm" variant="muted">
                                    This step is optional. Choose anything that
                                    fits.
                                </Text>
                            </div>
                            <div className="custom-scrollbar max-h-[55vh] overflow-y-auto pr-2">
                                <RolePicker
                                    allowedRoleIds={
                                        onboarding.onboarding
                                            .selfAssignableRoleIds
                                    }
                                    roles={roles}
                                    selectedRoleIds={selectedRoleIds}
                                    onChange={setSelectedRoleIds}
                                />
                            </div>
                            <div className="flex justify-end border-t border-border-subtle pt-6">
                                <Button
                                    className="w-full px-6 py-2.5 sm:w-auto"
                                    loading={updateSelfRoles.isPending}
                                    variant="primary"
                                    onClick={handleRolesNext}
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'welcome' && (
                        <div className="space-y-6">
                            <div>
                                <Heading
                                    className="mb-1"
                                    level={2}
                                    variant="sub"
                                >
                                    You’re In
                                </Heading>
                                <Text as="p" size="sm" variant="muted">
                                    Start with one of these channels, or jump to
                                    the server landing channel.
                                </Text>
                            </div>
                            {welcomeChannels.length > 0 && (
                                <div className="custom-scrollbar grid max-h-[55vh] gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
                                    {welcomeChannels.map((channel) => (
                                        <Button
                                            className="justify-start rounded-xl border border-border-subtle bg-bg-secondary/40 px-4 py-3 text-left shadow-none transition-all duration-200 hover:border-primary hover:bg-bg-secondary/80"
                                            innerClassName="justify-start"
                                            key={channel._id}
                                            type="button"
                                            variant="normal"
                                            onClick={() => {
                                                dispatch(
                                                    setSelectedChannelId(
                                                        channel._id,
                                                    ),
                                                );
                                                void navigate(
                                                    `/chat/@server/${serverId}/channel/${channel._id}`,
                                                );
                                            }}
                                        >
                                            {channelIcon(channel)}
                                            <span className="truncate text-sm font-semibold">
                                                {channel.name}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end border-t border-border-subtle pt-6">
                                <Button
                                    className="w-full px-6 py-2.5 sm:w-auto"
                                    loading={completeOnboarding.isPending}
                                    variant="primary"
                                    onClick={handleFinish}
                                >
                                    Enter Server
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
