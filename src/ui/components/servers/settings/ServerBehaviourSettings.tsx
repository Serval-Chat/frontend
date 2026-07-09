import { useMemo, useReducer } from 'react';

import {
    useRoles,
    useServerDetails,
    useUpdateServer,
} from '@/api/servers/servers.queries';
import type { Role, Server } from '@/api/servers/servers.types';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { mergeReducer } from '@/utils/mergeReducer';

import { MarkdownBlockadeSettings } from './MarkdownBlockadeSettings';

interface ServerBehaviourSettingsProps {
    serverId: string;
}

interface ServerBehaviourSettingsFormProps {
    server: Server;
    roles: Role[];
    serverId: string;
}

const ServerBehaviourSettingsForm = ({
    server,
    roles,
    serverId,
}: ServerBehaviourSettingsFormProps) => {
    const { mutate: updateServer, isPending: isUpdating } =
        useUpdateServer(serverId);

    interface BehaviourState {
        selectedRoleId: string | null;
        originalRoleId: string | null;
        disableCustomFonts: boolean;
        originalFonts: boolean;
        disableUsernameGlowAndCustomColor: boolean;
        originalGlow: boolean;
    }
    const [state, patch] = useReducer(mergeReducer<BehaviourState>, {
        selectedRoleId: server.defaultRoleId || null,
        originalRoleId: server.defaultRoleId || null,
        disableCustomFonts: server.disableCustomFonts || false,
        originalFonts: server.disableCustomFonts || false,
        disableUsernameGlowAndCustomColor:
            server.disableUsernameGlowAndCustomColor || false,
        originalGlow: server.disableUsernameGlowAndCustomColor || false,
    });
    const {
        selectedRoleId,
        originalRoleId,
        disableCustomFonts,
        originalFonts,
        disableUsernameGlowAndCustomColor,
        originalGlow,
    } = state;
    const setSelectedRoleId = (v: string | null): void => {
        patch({ selectedRoleId: v });
    };
    const setOriginalRoleId = (v: string | null): void => {
        patch({ originalRoleId: v });
    };
    const setDisableCustomFonts = (v: boolean): void => {
        patch({ disableCustomFonts: v });
    };
    const setOriginalFonts = (v: boolean): void => {
        patch({ originalFonts: v });
    };
    const setDisableUsernameGlowAndCustomColor = (v: boolean): void => {
        patch({ disableUsernameGlowAndCustomColor: v });
    };
    const setOriginalGlow = (v: boolean): void => {
        patch({ originalGlow: v });
    };

    const hasChanges =
        selectedRoleId !== originalRoleId ||
        disableCustomFonts !== originalFonts ||
        disableUsernameGlowAndCustomColor !== originalGlow;

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            {
                defaultRoleId: selectedRoleId ?? undefined,
                disableCustomFonts,
                disableUsernameGlowAndCustomColor,
            },
            {
                onSuccess: (): void => {
                    setOriginalRoleId(selectedRoleId);
                    setOriginalFonts(disableCustomFonts);
                    setOriginalGlow(disableUsernameGlowAndCustomColor);
                },
            },
        );
    };

    const handleReset = (): void => {
        setSelectedRoleId(originalRoleId);
        setDisableCustomFonts(originalFonts);
        setDisableUsernameGlowAndCustomColor(originalGlow);
    };

    // Filter out @everyone
    const selectableRoles = useMemo(
        (): Role[] =>
            roles.filter((role): boolean => role.name !== '@everyone'),
        [roles],
    );

    const dropdownOptions = useMemo(() => {
        const roleOptions = selectableRoles.map((role) => ({
            id: role.id,
            label: role.name,
            icon: <RoleDot role={role} />,
        }));

        return [
            {
                id: 'none',
                label: 'None',
                description: 'Users will only have the @everyone role.',
            },
            ...roleOptions,
        ];
    }, [selectableRoles]);

    const handleDropdownChange = (value: string | null): void => {
        setSelectedRoleId(value === 'none' ? null : value);
    };

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Server Behaviour
                </Heading>
                <Text variant="muted">
                    Configure how users interact with your server and automated
                    actions (one day).
                </Text>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Text as="p" weight="semibold">
                            Default Join Role
                        </Text>
                        <Text as="p" size="xs" variant="muted">
                            Automatically assign this role to new members when
                            they join the server.
                        </Text>
                    </div>

                    <div className="max-w-md">
                        <DropdownWithSearch
                            noOptionsMessage="No roles found"
                            options={dropdownOptions}
                            placeholder="Select a role..."
                            searchPlaceholder="Search roles..."
                            value={
                                selectedRoleId === null
                                    ? 'none'
                                    : selectedRoleId
                            }
                            onChange={handleDropdownChange}
                        />
                    </div>
                </div>

                <div className="border-t border-border-subtle pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Text as="p" weight="semibold">
                                Disable Custom Fonts
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Force all members to use system fonts in this
                                server.
                            </Text>
                        </div>
                        <Toggle
                            checked={disableCustomFonts}
                            onCheckedChange={setDisableCustomFonts}
                        />
                    </div>
                </div>

                <div className="border-t border-border-subtle pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Text as="p" weight="semibold">
                                Disable Username Glow and Custom Color
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Force all members to use standard colors without
                                glow.
                            </Text>
                        </div>
                        <Toggle
                            checked={disableUsernameGlowAndCustomColor}
                            onCheckedChange={
                                setDisableUsernameGlowAndCustomColor
                            }
                        />
                    </div>
                </div>

                <MarkdownBlockadeSettings
                    isPending={isUpdating}
                    rules={server.markdownBlockadeRules}
                    serverId={serverId}
                    onSave={(markdownBlockadeRules): void => {
                        updateServer({ markdownBlockadeRules });
                    }}
                />
            </div>

            <SettingsFloatingBar
                isPending={isUpdating}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />
        </div>
    );
};

export const ServerBehaviourSettings = ({
    serverId,
}: ServerBehaviourSettingsProps) => {
    const { data: server, isLoading: isServerLoading } =
        useServerDetails(serverId);
    const { data: roles, isLoading: isRolesLoading } = useRoles(serverId);

    if (isServerLoading || isRolesLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!server || !roles) return null;

    return (
        <ServerBehaviourSettingsForm
            key={server.id}
            roles={roles}
            server={server}
            serverId={serverId}
        />
    );
};
