import { Settings, Shield, SlidersHorizontal, Webhook } from 'lucide-react';

import {
    SettingsSidebarLayout,
    type SettingsSidebarSection,
} from '@/ui/components/common/settings/SettingsSidebarLayout';

interface ChannelSettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    channelName: string;
}

const CHANNEL_SETTINGS_SECTIONS: SettingsSidebarSection[] = [
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
        id: 'behaviour',
        label: 'Behaviour',
        icon: SlidersHorizontal,
    },
    {
        id: 'webhooks',
        label: 'Webhooks',
        icon: Webhook,
    },
];

export const ChannelSettingsSidebar = ({
    activeSection,
    setActiveSection,
    channelName,
}: ChannelSettingsSidebarProps) => (
    <SettingsSidebarLayout
        activeSection={activeSection}
        headerText={`#${channelName} Settings`}
        sections={CHANNEL_SETTINGS_SECTIONS}
        setActiveSection={setActiveSection}
    />
);
