import { Settings, Shield, SlidersHorizontal } from 'lucide-react';

import {
    SettingsSidebarLayout,
    type SettingsSidebarSection,
} from '@/ui/components/common/settings/SettingsSidebarLayout';

interface CategorySettingsSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    categoryName: string;
}

const CATEGORY_SETTINGS_SECTIONS: SettingsSidebarSection[] = [
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
];

export const CategorySettingsSidebar = ({
    activeSection,
    setActiveSection,
    categoryName,
}: CategorySettingsSidebarProps) => (
    <SettingsSidebarLayout
        activeSection={activeSection}
        headerText={`${categoryName} Settings`}
        sections={CATEGORY_SETTINGS_SECTIONS}
        setActiveSection={setActiveSection}
    />
);
