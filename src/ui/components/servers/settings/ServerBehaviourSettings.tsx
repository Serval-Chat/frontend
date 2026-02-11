import React, { useMemo, useState } from 'react';

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

interface ServerBehaviourSettingsProps {
    serverId: string;
}

interface ServerBehaviourSettingsFormProps {
    server: Server;
    roles: Role[];
    serverId: string;
}

const ServerBehaviourSettingsForm: React.FC<
    ServerBehaviourSettingsFormProps
> = ({ server, roles, serverId }) => {
    const { mutate: updateServer, isPending: isUpdating } =
        useUpdateServer(serverId);

    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
        server.defaultRoleId || null,
    );
    const [originalRoleId, setOriginalRoleId] = useState<string | null>(
        server.defaultRoleId || null,
    );
    const [disableCustomFonts, setDisableCustomFonts] = useState(
        server.disableCustomFonts || false,
    );
    const [originalFonts, setOriginalFonts] = useState(
        server.disableCustomFonts || false,
    );

    const hasChanges =
        selectedRoleId !== originalRoleId ||
        disableCustomFonts !== originalFonts;

    const handleSave = (): void => {
        if (!hasChanges) return;
        updateServer(
            {
                defaultRoleId: selectedRoleId ?? undefined,
                disableCustomFonts,
            },
            {
                onSuccess: () => {
                    setOriginalRoleId(selectedRoleId);
                    setOriginalFonts(disableCustomFonts);
                },
            },
        );
    };

    const handleReset = (): void => {
        setSelectedRoleId(originalRoleId);
        setDisableCustomFonts(originalFonts);
    };

    // Filter out @everyone
    const selectableRoles = useMemo(
        () => roles.filter((role) => role.name !== '@everyone'),
        [roles],
    );

    const dropdownOptions = useMemo(() => {
        const roleOptions = selectableRoles.map((role) => ({
            id: role._id,
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
                <Text className="text-[var(--color-muted-foreground)]">
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
                        <Text
                            as="p"
                            className="text-[var(--color-muted-foreground)]"
                            size="xs"
                        >
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

                <div className="pt-6 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Text as="p" weight="semibold">
                                Disable Custom Fonts
                            </Text>
                            <Text
                                as="p"
                                className="text-[var(--color-muted-foreground)]"
                                size="xs"
                            >
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

export const ServerBehaviourSettings: React.FC<
    ServerBehaviourSettingsProps
> = ({ serverId }) => {
    const { data: server, isLoading: isServerLoading } =
        useServerDetails(serverId);
    const { data: roles, isLoading: isRolesLoading } = useRoles(serverId);

    if (isServerLoading || isRolesLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (!server || !roles) return null;

    return (
        <ServerBehaviourSettingsForm
            key={server._id}
            roles={roles}
            server={server}
            serverId={serverId}
        />
    );
};
