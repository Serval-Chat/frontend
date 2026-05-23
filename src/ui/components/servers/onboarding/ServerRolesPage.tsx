import React, { useState } from 'react';

import { Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useOnboarding,
    useRoles,
    useUpdateSelfRoles,
} from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

import { RolePicker } from './ServerOnboardingModals';

export const ServerRolesPage: React.FC = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId ?? '');
    const { data: roles } = useRoles(serverId ?? '');
    const updateSelfRoles = useUpdateSelfRoles(serverId ?? '');
    const allowedRoleIds = onboarding?.onboarding.selfAssignableRoleIds ?? [];
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    React.useEffect(() => {
        if (!onboarding) return;
        const allowed = new Set(onboarding.onboarding.selfAssignableRoleIds);
        setSelectedRoleIds(
            onboarding.member.roles.filter((roleId) => allowed.has(roleId)),
        );
    }, [onboarding]);

    const handleSave = (): void => {
        if (!serverId) return;
        updateSelfRoles.mutate(selectedRoleIds, {
            onSuccess: () => setHasUnsavedChanges(false),
        });
    };

    const handleChange = (newRoleIds: string[]): void => {
        setSelectedRoleIds(newRoleIds);
        setHasUnsavedChanges(true);
    };

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <Box className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
            {/* Header */}
            <Box
                as="header"
                className="z-50 flex shrink-0 items-center gap-3 border-b border-white/5 bg-[var(--bg-chat-header)] px-4 py-3 backdrop-blur-sm"
            >
                <button
                    aria-label="Back to server"
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                    onClick={handleBack}
                >
                    ←
                </button>
                <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Box className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] leading-5 font-semibold text-foreground">
                        Roles
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        Pick the roles you want in this server.
                    </span>
                </Box>
            </Box>

            <Box className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-10">
                {!onboarding || !roles ? (
                    <div className="flex min-h-40 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-6 pb-24">
                        <RolePicker
                            allowedRoleIds={allowedRoleIds}
                            roles={roles}
                            selectedRoleIds={selectedRoleIds}
                            onChange={handleChange}
                        />
                    </div>
                )}
            </Box>

            {hasUnsavedChanges && (
                <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border-subtle bg-bg-secondary/90 px-6 py-4 whitespace-nowrap shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <Text className="text-sm font-medium">
                            Careful — you have unsaved changes!
                        </Text>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (onboarding) {
                                        const allowed = new Set(
                                            onboarding.onboarding
                                                .selfAssignableRoleIds,
                                        );
                                        setSelectedRoleIds(
                                            onboarding.member.roles.filter(
                                                (roleId) => allowed.has(roleId),
                                            ),
                                        );
                                    }
                                    setHasUnsavedChanges(false);
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                loading={updateSelfRoles.isPending}
                                variant="primary"
                                onClick={handleSave}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};
