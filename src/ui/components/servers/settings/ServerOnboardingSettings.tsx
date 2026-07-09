import React, { useMemo, useReducer } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import {
    useCategories,
    useChannels,
    useOnboardingSettings,
    useRoles,
    useUpdateOnboardingSettings,
} from '@/api/servers/servers.queries';
import type {
    Category,
    Channel,
    ServerOnboardingSettings as OnboardingSettingsData,
    Role,
} from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { Toggle } from '@/ui/components/common/Toggle';
import { ChannelIcon } from '@/ui/components/servers/ChannelIcon';
import { cn } from '@/utils/cn';

interface ServerOnboardingSettingsProps {
    serverId: string;
}

const channelIcon = (channel: Channel): React.ReactNode => (
    <ChannelIcon
        className="h-3.5 w-3.5 text-muted-foreground"
        emoji={channel.emoji}
        emojiType={channel.emojiType}
        icon={channel.icon}
        type={channel.type}
    />
);

const sortByPosition = <T extends { position: number }>(items: T[]): T[] =>
    items.toSorted((a, b): number => a.position - b.position);

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];

const RoleSelectGrid = ({
    roles,
    selectedIds,
    onChange,
}: {
    roles: Role[];
    selectedIds: string[];
    onChange: (roleIds: string[]) => void;
}) => {
    const selected = new Set(selectedIds);
    const selectableRoles = roles.filter(
        (role): boolean => role.name !== '@everyone',
    );

    const toggleRole = (roleId: string): void => {
        const next = new Set(selected);
        if (next.has(roleId)) {
            next.delete(roleId);
        } else {
            next.add(roleId);
        }
        onChange([...next]);
    };

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {selectableRoles.map((role) => {
                const isSelected = selected.has(role.id);
                return (
                    <button
                        className={cn(
                            'flex w-full flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                            isSelected
                                ? 'border-primary bg-primary/10'
                                : 'hover:border-border border-border-subtle bg-bg-subtle hover:bg-bg-secondary/60',
                        )}
                        key={role.id}
                        type="button"
                        onClick={(): void => {
                            toggleRole(role.id);
                        }}
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
                        {role.description ? (
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
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
};

const WelcomeChannelGrid = ({
    channels,
    categories,
    selectedIds,
    onChange,
}: {
    channels: Channel[];
    categories?: Category[];
    selectedIds: string[];
    onChange: (channelIds: string[]) => void;
}) => {
    const selected = new Set(selectedIds);
    const selectableChannels = sortByPosition(
        channels.filter((channel): boolean => channel.type !== 'link'),
    );

    const toggleChannel = (channelId: string): void => {
        const next = new Set(selected);
        if (next.has(channelId)) {
            next.delete(channelId);
        } else if (next.size < 8) {
            next.add(channelId);
        }
        onChange([...next]);
    };

    const groupedChannels = useMemo(() => {
        const sortedChannels = selectableChannels;
        const sortedCategories = sortByPosition(categories ?? []);
        return [
            {
                category: null,
                channels: sortedChannels.filter(
                    (channel): boolean =>
                        !channel.categoryId ||
                        !categories?.find(
                            (c): boolean => c.id === channel.categoryId,
                        ),
                ),
            },
            ...sortedCategories.map(
                (category): { category: Category; channels: Channel[] } => ({
                    category,
                    channels: sortedChannels.filter(
                        (channel): boolean =>
                            channel.categoryId === category.id,
                    ),
                }),
            ),
        ].filter((group): boolean => group.channels.length > 0);
    }, [selectableChannels, categories]);

    return (
        <div className="flex flex-col gap-4">
            {groupedChannels.map((group) => (
                <div
                    className="space-y-2"
                    key={group.category?.id ?? 'uncategorized'}
                >
                    {group.category ? (
                        <Text className="px-1 text-xs font-bold tracking-wider text-muted-foreground/70 uppercase">
                            {group.category.name}
                        </Text>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                        {group.channels.map((channel) => {
                            const isSelected = selected.has(channel.id);
                            return (
                                <Button
                                    className={cn(
                                        'justify-start rounded-md border-border-subtle px-3 py-2 text-left shadow-none',
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'bg-bg-subtle text-muted-foreground hover:text-foreground',
                                    )}
                                    disabled={
                                        isSelected ? false : selected.size >= 8
                                    }
                                    justify="start"
                                    key={channel.id}
                                    type="button"
                                    variant="normal"
                                    onClick={(): void => {
                                        toggleChannel(channel.id);
                                    }}
                                >
                                    {channelIcon(channel)}
                                    <span className="truncate">
                                        {channel.name}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const computeBaseline = (
    data: OnboardingSettingsData,
    parsedRules: string[],
): string =>
    JSON.stringify({
        ...data,
        guidelines: parsedRules,
        selfAssignableRoleIds: toStringArray(data.selfAssignableRoleIds),
        welcomeChannelIds: toStringArray(data.welcomeChannelIds),
    });

// enabled/rules/selfAssignableRoleIds/landingChannelId/welcomeChannelIds/
// baseline/syncedSettings all update together (though not identically - see
// each action below) on server sync, Reset, and Save success, so they're one
// reducer instead of 7 separately-set useState calls.
interface OnboardingFormState {
    enabled: boolean;
    rules: string[];
    selfAssignableRoleIds: string[];
    landingChannelId: string | null;
    welcomeChannelIds: string[];
    baseline: string;
    syncedSettings: OnboardingSettingsData | undefined;
}

const initialOnboardingFormState: OnboardingFormState = {
    enabled: false,
    rules: [],
    selfAssignableRoleIds: [],
    landingChannelId: null,
    welcomeChannelIds: [],
    baseline: '',
    syncedSettings: undefined,
};

type OnboardingFormAction =
    | {
          type: 'syncFromSettings';
          settings: OnboardingSettingsData | undefined;
      }
    | { type: 'reset'; settings: OnboardingSettingsData }
    | { type: 'saveSuccess'; next: OnboardingSettingsData }
    | { type: 'setEnabled'; value: boolean }
    | { type: 'setRules'; value: string[] }
    | { type: 'setSelfAssignableRoleIds'; value: string[] }
    | { type: 'setLandingChannelId'; value: string | null }
    | { type: 'setWelcomeChannelIds'; value: string[] };

function onboardingFormReducer(
    state: OnboardingFormState,
    action: OnboardingFormAction,
): OnboardingFormState {
    switch (action.type) {
        case 'syncFromSettings': {
            if (!action.settings) {
                return { ...state, syncedSettings: action.settings };
            }
            const parsedRules = toStringArray(action.settings.guidelines);
            return {
                ...state,
                syncedSettings: action.settings,
                enabled: action.settings.enabled,
                rules: parsedRules,
                selfAssignableRoleIds: toStringArray(
                    action.settings.selfAssignableRoleIds,
                ),
                landingChannelId: action.settings.landingChannelId ?? null,
                welcomeChannelIds: toStringArray(
                    action.settings.welcomeChannelIds,
                ),
                baseline: computeBaseline(action.settings, parsedRules),
            };
        }
        case 'reset': {
            return {
                ...state,
                enabled: action.settings.enabled,
                rules: toStringArray(action.settings.guidelines),
                selfAssignableRoleIds: toStringArray(
                    action.settings.selfAssignableRoleIds,
                ),
                landingChannelId: action.settings.landingChannelId ?? null,
                welcomeChannelIds: toStringArray(
                    action.settings.welcomeChannelIds,
                ),
            };
        }
        case 'saveSuccess': {
            const parsedRules = toStringArray(action.next.guidelines);
            return {
                ...state,
                rules: parsedRules,
                selfAssignableRoleIds: toStringArray(
                    action.next.selfAssignableRoleIds,
                ),
                welcomeChannelIds: toStringArray(action.next.welcomeChannelIds),
                baseline: computeBaseline(action.next, parsedRules),
            };
        }
        case 'setEnabled': {
            return { ...state, enabled: action.value };
        }
        case 'setRules': {
            return { ...state, rules: action.value };
        }
        case 'setSelfAssignableRoleIds': {
            return { ...state, selfAssignableRoleIds: action.value };
        }
        case 'setLandingChannelId': {
            return { ...state, landingChannelId: action.value };
        }
        case 'setWelcomeChannelIds': {
            return { ...state, welcomeChannelIds: action.value };
        }
        default: {
            return state;
        }
    }
}

export const ServerOnboardingSettings = ({
    serverId,
}: ServerOnboardingSettingsProps) => {
    const { data: settings, isLoading: isSettingsLoading } =
        useOnboardingSettings(serverId);
    const { data: roles, isLoading: isRolesLoading } = useRoles(serverId);
    const { data: channels, isLoading: isChannelsLoading } =
        useChannels(serverId);
    const { data: categories } = useCategories(serverId);
    const updateSettings = useUpdateOnboardingSettings(serverId);

    const [form, dispatchForm] = useReducer(
        onboardingFormReducer,
        initialOnboardingFormState,
    );
    const {
        enabled,
        rules,
        selfAssignableRoleIds,
        landingChannelId,
        welcomeChannelIds,
        baseline,
        syncedSettings,
    } = form;

    if (settings !== syncedSettings) {
        dispatchForm({ type: 'syncFromSettings', settings });
    }

    const channelOptions = useMemo(
        (): { id: string; label: string; icon: React.ReactNode }[] =>
            sortByPosition(
                (channels ?? []).filter((c): boolean => c.type !== 'link'),
            ).map(
                (
                    channel,
                ): { id: string; label: string; icon: React.ReactNode } => ({
                    id: channel.id,
                    label: channel.name,
                    icon: channelIcon(channel),
                }),
            ),
        [channels],
    );

    const current = useMemo(
        () => ({
            enabled,
            guidelines: rules.flatMap((r): string[] => {
                const t = r.trim();
                return t ? [t] : [];
            }),
            selfAssignableRoleIds,
            landingChannelId,
            welcomeChannelIds,
        }),
        [
            enabled,
            rules,
            selfAssignableRoleIds,
            landingChannelId,
            welcomeChannelIds,
        ],
    );
    const hasChanges = baseline !== '' && JSON.stringify(current) !== baseline;

    const handleReset = (): void => {
        if (!settings) return;
        dispatchForm({ type: 'reset', settings });
    };

    const handleSave = (): void => {
        updateSettings.mutate(current, {
            onSuccess: (next): void => {
                dispatchForm({ type: 'saveSuccess', next });
            },
        });
    };

    if (isSettingsLoading || isRolesLoading || isChannelsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!settings || !roles || !channels) return null;

    return (
        <div className="max-w-3xl space-y-8 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Onboarding
                </Heading>
                <Text variant="muted">
                    Configure what new members see when they first join this
                    server.
                </Text>
            </div>

            <div className="flex items-center justify-between border-b border-border-subtle pb-6">
                <div className="space-y-1">
                    <Text as="p" weight="semibold">
                        Enable Onboarding
                    </Text>
                    <Text as="p" size="xs" variant="muted">
                        New members who join after this is enabled will complete
                        onboarding once.
                    </Text>
                </div>
                <Toggle
                    checked={enabled}
                    onCheckedChange={(value): void => {
                        dispatchForm({ type: 'setEnabled', value });
                    }}
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Text as="p" weight="semibold">
                        Server Guidelines (Rules)
                    </Text>
                    <span className="text-xs text-muted-foreground">
                        {rules.length} rule{rules.length === 1 ? null : 's'}
                    </span>
                </div>

                {rules.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border-subtle bg-bg-secondary/20 p-6 text-center">
                        <Text as="p" size="sm" variant="muted">
                            No rules have been added yet. Click below to add the
                            first rule.
                        </Text>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rules.map((rule, idx) => (
                            <div
                                className="hover:border-border flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary/40 p-3 transition-colors"
                                key={`rule-${rule}`}
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <TextArea
                                        autoResize
                                        id={`rule-input-${idx}`}
                                        placeholder={`Rule #${idx + 1} description...`}
                                        value={rule}
                                        onChange={(e): void => {
                                            const next = [...rules];
                                            next[idx] = e.target.value;
                                            dispatchForm({
                                                type: 'setRules',
                                                value: next,
                                            });
                                        }}
                                        onKeyDown={(e): void => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                const next = [...rules];
                                                next.splice(idx + 1, 0, '');
                                                dispatchForm({
                                                    type: 'setRules',
                                                    value: next,
                                                });
                                                setTimeout((): void => {
                                                    document
                                                        .getElementById(
                                                            `rule-input-${idx + 1}`,
                                                        )
                                                        ?.focus();
                                                }, 0);
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    className="h-8 w-8 min-w-0 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                                    type="button"
                                    variant="ghost"
                                    onClick={(): void => {
                                        const next = rules.filter(
                                            (_, i): boolean => i !== idx,
                                        );
                                        dispatchForm({
                                            type: 'setRules',
                                            value: next,
                                        });
                                    }}
                                >
                                    <Trash2 size={15} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <Button
                    className="flex w-full items-center justify-center rounded-lg border border-dashed border-border-subtle py-2.5 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                    variant="ghost"
                    onClick={(): void => {
                        dispatchForm({
                            type: 'setRules',
                            value: [...rules, ''],
                        });
                        setTimeout((): void => {
                            document
                                .getElementById(`rule-input-${rules.length}`)
                                ?.focus();
                        }, 0);
                    }}
                >
                    <Plus className="mr-2" size={16} /> Add Rule
                </Button>
            </div>

            <div className="space-y-3">
                <Text as="p" weight="semibold">
                    Self-Assignable Roles
                </Text>
                <RoleSelectGrid
                    roles={roles}
                    selectedIds={selfAssignableRoleIds}
                    onChange={(value): void => {
                        dispatchForm({
                            type: 'setSelfAssignableRoleIds',
                            value,
                        });
                    }}
                />
            </div>

            <div className="space-y-3">
                <Text as="p" weight="semibold">
                    Landing Channel
                </Text>
                <DropdownWithSearch
                    allowClear
                    noOptionsMessage="No channels found"
                    options={channelOptions}
                    placeholder="Select a channel..."
                    searchPlaceholder="Search channels..."
                    value={landingChannelId}
                    onChange={(value): void => {
                        dispatchForm({ type: 'setLandingChannelId', value });
                    }}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <Text as="p" weight="semibold">
                        Welcome Modal Channels
                    </Text>
                    <Text size="xs" variant="muted">
                        {welcomeChannelIds.length} / 8
                    </Text>
                </div>
                <WelcomeChannelGrid
                    categories={categories ?? []}
                    channels={channels ?? []}
                    selectedIds={welcomeChannelIds}
                    onChange={(value): void => {
                        dispatchForm({ type: 'setWelcomeChannelIds', value });
                    }}
                />
            </div>

            <SettingsFloatingBar
                isPending={updateSettings.isPending}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />
        </div>
    );
};
