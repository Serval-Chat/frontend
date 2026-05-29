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

export const CategorySettingsSidebar = ({
    activeSection,
    setActiveSection,
    categoryName,
}: CategorySettingsSidebarProps) => {
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
            id: 'behaviour',
            label: 'Behaviour',
            icon: SlidersHorizontal,
        },
    ];

    return (
        <SettingsSidebarLayout
            activeSection={activeSection}
            headerText={`${categoryName} Settings`}
            sections={sections}
            setActiveSection={setActiveSection}
        />
    );
};
