import React, { useState } from 'react';

import { type Channel } from '@/api/servers/servers.types';
import { SettingsContentPane } from '@/ui/components/common/settings/SettingsContentPane';
import { SettingsModalLayout } from '@/ui/components/common/settings/SettingsModalLayout';
import { ChannelSettingsSidebar } from '@/ui/components/servers/settings/ChannelSettingsSidebar';

const ChannelOverviewSettings = React.lazy(() =>
    import('@/ui/components/servers/settings/ChannelOverviewSettings').then(
        (m) => ({ default: m.ChannelOverviewSettings }),
    ),
);

const ChannelWebhookSettings = React.lazy(() =>
    import('@/ui/components/servers/settings/ChannelWebhookSettings').then(
        (m) => ({ default: m.ChannelWebhookSettings }),
    ),
);

const ChannelBehaviourSettings = React.lazy(() =>
    import('@/ui/components/servers/settings/ChannelBehaviourSettings').then(
        (m) => ({ default: m.ChannelBehaviourSettings }),
    ),
);

const PermissionsEditorTab = React.lazy(() =>
    import('@/ui/components/servers/settings/permissions/PermissionsEditorTab').then(
        (m) => ({ default: m.PermissionsEditorTab }),
    ),
);

interface ChannelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel;
}

export const ChannelSettingsModal = ({
    isOpen,
    onClose,
    channel,
}: ChannelSettingsModalProps) => {
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

    const handleSetSection = (sectionId: string): void => {
        setIsMobileSidebarOpen(false);
        setActiveSection(sectionId);
    };

    return (
        <SettingsModalLayout
            closeButtonOffsetClass={
                activeSection === 'permissions' ? 'right-[304px]' : 'right-12'
            }
            isMobileSidebarOpen={isMobileSidebarOpen}
            isOpen={isOpen}
            sidebar={
                <ChannelSettingsSidebar
                    activeSection={activeSection}
                    channelName={channel.name}
                    setActiveSection={handleSetSection}
                />
            }
            onClose={onClose}
            onMobileBackClick={(): void => setIsMobileSidebarOpen(true)}
        >
            <React.Suspense fallback={null}>
                {activeSection === 'overview' ? (
                    <SettingsContentPane>
                        <ChannelOverviewSettings
                            channel={channel}
                            onDeleted={onClose}
                        />
                    </SettingsContentPane>
                ) : activeSection === 'webhooks' ? (
                    <SettingsContentPane>
                        <ChannelWebhookSettings
                            channelId={channel.id}
                            serverId={channel.serverId}
                        />
                    </SettingsContentPane>
                ) : activeSection === 'behaviour' ? (
                    <SettingsContentPane>
                        <ChannelBehaviourSettings channel={channel} />
                    </SettingsContentPane>
                ) : (
                    <div className="flex h-full flex-1 flex-col overflow-hidden">
                        <PermissionsEditorTab
                            serverId={channel.serverId}
                            targetId={channel.id}
                            targetType="channel"
                        />
                    </div>
                )}
            </React.Suspense>
        </SettingsModalLayout>
    );
};
