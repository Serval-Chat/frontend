import React from 'react';

import { Settings, Shield, Webhook } from 'lucide-react';

import {
    SettingsSidebarLayout,
    type SettingsSidebarSection,
} from '@/ui/components/common/settings/SettingsSidebarLayout';

interface ChannelSettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    channelName: string;
}

export const ChannelSettingsSidebar: React.FC<ChannelSettingsSidebarProps> = ({
    activeSection,
    setActiveSection,
    channelName,
}) => {
    const sections: SettingsSidebarSection[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: Settings,
        },
        {
            id: 'permissions',
            label: 'Permissions',
            icon: Shield,
        },
        {
            id: 'webhooks',
            label: 'Webhooks',
            icon: Webhook,
        },
    ];

    return (
        <SettingsSidebarLayout
            activeSection={activeSection}
            headerText={`#${channelName} Settings`}
            sections={sections}
            setActiveSection={setActiveSection}
        />
    );
};
