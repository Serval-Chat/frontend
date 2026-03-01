import React, { useState } from 'react';

import { type Channel } from '@/api/servers/servers.types';
import { SettingsContentPane } from '@/ui/components/common/settings/SettingsContentPane';
import { SettingsModalLayout } from '@/ui/components/common/settings/SettingsModalLayout';
import { ChannelOverviewSettings } from '@/ui/components/servers/settings/ChannelOverviewSettings';
import { ChannelSettingsSidebar } from '@/ui/components/servers/settings/ChannelSettingsSidebar';
import { PermissionsEditorTab } from '@/ui/components/servers/settings/permissions/PermissionsEditorTab';

interface ChannelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel;
}

export const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
    isOpen,
    onClose,
    channel,
}) => {
    const [activeSection, setActiveSection] = useState<string>('overview');

    return (
        <SettingsModalLayout
            closeButtonOffsetClass={
                activeSection === 'permissions' ? 'right-[304px]' : 'right-12'
            }
            isOpen={isOpen}
            sidebar={
                <ChannelSettingsSidebar
                    activeSection={activeSection}
                    channelName={channel.name}
                    setActiveSection={setActiveSection}
                />
            }
            onClose={onClose}
        >
            {activeSection === 'overview' ? (
                <SettingsContentPane>
                    <ChannelOverviewSettings
                        channel={channel}
                        onDeleted={onClose}
                    />
                </SettingsContentPane>
            ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <PermissionsEditorTab
                        serverId={channel.serverId}
                        targetId={channel._id}
                        targetType="channel"
                    />
                </div>
            )}
        </SettingsModalLayout>
    );
};
