import { useState } from 'react';

import { Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useOnboarding,
    useRoles,
    useUpdateSelfRoles,
} from '@/api/servers/servers.queries';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Box } from '@/ui/components/layout/Box';

import { RolePicker } from './ServerOnboardingModals';

export const ServerRolesPage = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();
    const { data: onboarding } = useOnboarding(serverId ?? '');
    const { data: roles } = useRoles(serverId ?? '');
    const updateSelfRoles = useUpdateSelfRoles(serverId ?? '');
    const allowedRoleIds = onboarding?.onboarding.selfAssignableRoleIds ?? [];
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [syncedOnboarding, setSyncedOnboarding] = useState(onboarding);

    if (onboarding !== syncedOnboarding) {
        setSyncedOnboarding(onboarding);
        if (onboarding) {
            const allowed = new Set(
                onboarding.onboarding.selfAssignableRoleIds,
            );
            setSelectedRoleIds(
                onboarding.member.roles.filter((roleId): boolean =>
                    allowed.has(roleId),
                ),
            );
        }
    }

    const handleSave = (): void => {
        if (!serverId) return;
        updateSelfRoles.mutate(selectedRoleIds, {
            onSuccess: (): void => setHasUnsavedChanges(false),
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
        <Box className="chat-background relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header */}
            <Box
                as="header"
                className="pride-glass-strong z-50 flex shrink-0 items-center gap-3 border-b border-white/5 bg-[var(--bg-chat-header)] px-4 py-3 backdrop-blur-sm"
            >
                <button
                    aria-label="Back to server"
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                    type="button"
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

            <SettingsFloatingBar
                containerClassName="pride-glass-input"
                isPending={updateSelfRoles.isPending}
                isVisible={hasUnsavedChanges}
                offset="0px"
                onReset={(): void => {
                    if (onboarding) {
                        const allowed = new Set(
                            onboarding.onboarding.selfAssignableRoleIds,
                        );
                        setSelectedRoleIds(
                            onboarding.member.roles.filter((roleId): boolean =>
                                allowed.has(roleId),
                            ),
                        );
                    }
                    setHasUnsavedChanges(false);
                }}
                onSave={handleSave}
            />
        </Box>
    );
};
