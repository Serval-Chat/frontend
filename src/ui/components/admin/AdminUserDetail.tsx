import { type ReactNode, useState } from 'react';

import { ArrowLeft, Shield, Users } from 'lucide-react';

import type { User } from '@/api/users/users.types';
import { useAdminUserWarnings } from '@/api/warnings/warnings.queries';
import { useAdminUserDetail } from '@/hooks/admin/useAdminUsers';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';
import { APP_LOCALE } from '@/utils/locale';

import { AdminBadgesManagement } from './AdminBadgesManagement';
import { AdminErrorDisplay } from './AdminErrorDisplay';
import { AdminModerationControls } from './AdminModerationControls';
import { AdminNotesSection } from './AdminNotesSection';
import {
    AdminAccountInformation,
    AdminAccountStatus,
    AdminServerMemberships,
    AdminUserSummaryHeader,
    AdminWarningHistory,
} from './AdminUserDetailSections';

interface AdminUserDetailProps {
    userId: string;
    onBack: () => void;
}

export const AdminUserDetail = ({
    userId,
    onBack,
}: AdminUserDetailProps): ReactNode => {
    const { data: adminData, isLoading, error } = useAdminUserDetail(userId);
    const { data: warnings } = useAdminUserWarnings(userId);
    const [now] = useState((): number => Date.now());

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <Text as="p" size="sm" variant="muted">
                        Loading user intelligence...
                    </Text>
                </div>
            </div>
        );
    }

    if (error || !adminData) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <Button
                    className="mb-8 w-fit self-start"
                    variant="ghost"
                    onClick={onBack}
                >
                    <ArrowLeft
                        className="transition-transform group-hover:-translate-x-1"
                        size={16}
                    />
                    Back to User List
                </Button>
                <AdminErrorDisplay
                    error={error}
                    title="Intelligence Retrieval Failed"
                />
            </div>
        );
    }

    const isCurrentlyBanned = adminData.banExpiry
        ? new Date(adminData.banExpiry).getTime() > now
        : false;
    const isCurrentlyMuted =
        adminData.muteActive === true ||
        (adminData.muteExpiry
            ? new Date(adminData.muteExpiry).getTime() > now
            : false);
    const muteUntilLabel = adminData.muteExpiry
        ? new Date(adminData.muteExpiry).toLocaleString(APP_LOCALE)
        : 'Permanent';
    const banUntilLabel = adminData.banExpiry
        ? new Date(adminData.banExpiry).toLocaleString(APP_LOCALE)
        : '';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex h-full flex-col duration-700">
            <Button className="mb-4 w-fit" variant="ghost" onClick={onBack}>
                <ArrowLeft
                    className="transition-transform group-hover:-translate-x-1"
                    size={16}
                />
                Back to User List
            </Button>

            <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
                <div className="flex flex-col overflow-hidden lg:col-span-1">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground uppercase">
                        <Users size={12} />
                        Public Profile View
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
                        <UserProfileCard
                            presenceStatus="offline"
                            user={
                                {
                                    ...adminData,
                                    profilePicture:
                                        adminData.profilePicture || undefined,
                                    banner: adminData.banner || undefined,
                                } as unknown as User
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-danger uppercase">
                        <Shield size={12} />
                        Administrative View
                    </div>
                    <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
                        <AdminUserSummaryHeader adminData={adminData} />

                        <AdminAccountStatus
                            adminData={adminData}
                            isCurrentlyBanned={isCurrentlyBanned}
                            isCurrentlyMuted={isCurrentlyMuted}
                            muteUntilLabel={muteUntilLabel}
                        />

                        <AdminModerationControls
                            banUntilLabel={banUntilLabel}
                            isCurrentlyBanned={isCurrentlyBanned}
                            isCurrentlyMuted={isCurrentlyMuted}
                            muteUntilLabel={muteUntilLabel}
                            userId={userId}
                        />

                        <AdminBadgesManagement
                            badges={adminData.badges}
                            userId={userId}
                        />

                        <AdminAccountInformation adminData={adminData} />

                        <AdminWarningHistory warnings={warnings} />

                        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
                            <AdminNotesSection
                                targetId={userId}
                                targetType="User"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AdminServerMemberships servers={adminData.servers} />
        </div>
    );
};
