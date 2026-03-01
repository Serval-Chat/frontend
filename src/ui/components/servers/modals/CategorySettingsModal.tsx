import React, { useState } from 'react';

import { type Category } from '@/api/servers/servers.types';
import { SettingsContentPane } from '@/ui/components/common/settings/SettingsContentPane';
import { SettingsModalLayout } from '@/ui/components/common/settings/SettingsModalLayout';
import { CategoryOverviewSettings } from '@/ui/components/servers/settings/CategoryOverviewSettings';
import { CategorySettingsSidebar } from '@/ui/components/servers/settings/CategorySettingsSidebar';
import { PermissionsEditorTab } from '@/ui/components/servers/settings/permissions/PermissionsEditorTab';

interface CategorySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export const CategorySettingsModal: React.FC<CategorySettingsModalProps> = ({
    isOpen,
    onClose,
    category,
}) => {
    const [activeSection, setActiveSection] = useState<string>('overview');

    return (
        <SettingsModalLayout
            closeButtonOffsetClass={
                activeSection === 'permissions' ? 'right-[304px]' : 'right-12'
            }
            isOpen={isOpen}
            sidebar={
                <CategorySettingsSidebar
                    activeSection={activeSection}
                    categoryName={category.name}
                    setActiveSection={setActiveSection}
                />
            }
            onClose={onClose}
        >
            {activeSection === 'overview' ? (
                <SettingsContentPane>
                    <CategoryOverviewSettings
                        category={category}
                        onDeleted={onClose}
                    />
                </SettingsContentPane>
            ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <PermissionsEditorTab
                        serverId={category.serverId}
                        targetId={category._id}
                        targetType="category"
                    />
                </div>
            )}
        </SettingsModalLayout>
    );
};
