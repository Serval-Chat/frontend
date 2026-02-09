import { type ReactNode, useState } from 'react';

import { AdminAuditLogs } from '@/ui/components/admin/AdminAuditLogs';
import { AdminIAM } from '@/ui/components/admin/AdminIAM';
import { AdminLayout } from '@/ui/components/admin/AdminLayout';
import { AdminOverview } from '@/ui/components/admin/AdminOverview';
import { AdminSettings } from '@/ui/components/admin/AdminSettings';
import { AdminSidebar } from '@/ui/components/admin/AdminSidebar';
import { AdminUserDetail } from '@/ui/components/admin/AdminUserDetail';
import { Text } from '@/ui/components/common/Text';

export const Admin = (): ReactNode => {
    const [activeSection, setActiveSection] = useState('overview');
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    const handleSectionChange = (section: string): void => {
        setActiveSection(section);
        setViewingUserId(null);
    };

    const renderContent = (): ReactNode => {
        switch (activeSection) {
            case 'overview':
                return <AdminOverview />;
            case 'users':
                return viewingUserId ? (
                    <AdminUserDetail
                        userId={viewingUserId}
                        onBack={() => setViewingUserId(null)}
                    />
                ) : (
                    <AdminIAM onViewUser={setViewingUserId} />
                );
            case 'logs':
                return <AdminAuditLogs />;
            case 'settings':
                return <AdminSettings />;
            default:
                return (
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle text-muted-foreground">
                        <Text as="p" size="lg" weight="medium">
                            Coming Soon
                        </Text>
                        <Text as="p" size="sm">
                            The {activeSection} management module is under
                            development.
                        </Text>
                    </div>
                );
        }
    };

    const getTitle = (): string => {
        const titles: Record<string, string> = {
            overview: 'System Overview',
            users: 'User Management',
            servers: 'Server Moderation',
            bans: 'Bans & Mutes',
            logs: 'Audit Logs',
            settings: 'Admin Settings',
        };
        if (activeSection === 'users' && viewingUserId) {
            return 'User Details';
        }
        return titles[activeSection] || 'Admin Panel';
    };

    return (
        <AdminLayout
            sidebar={
                <AdminSidebar
                    activeSection={activeSection}
                    onSectionChange={handleSectionChange}
                />
            }
            title={getTitle()}
        >
            {renderContent()}
        </AdminLayout>
    );
};
