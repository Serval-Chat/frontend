import React, { useState } from 'react';

import type { Category } from '@/api/servers/servers.types';
import { CategorySettingsSidebar } from '@/features/servers/settings/CategorySettingsSidebar';
import { SettingsContentPane } from '@/ui/primitives/settings/SettingsContentPane';
import { SettingsModalLayout } from '@/ui/primitives/settings/SettingsModalLayout';

const CategoryOverviewSettings = React.lazy(() =>
    import('@/features/servers/settings/CategoryOverviewSettings').then(
        (m) => ({ default: m.CategoryOverviewSettings }),
    ),
);

const PermissionsEditorTab = React.lazy(() =>
    import('@/features/servers/settings/permissions/PermissionsEditorTab').then(
        (m) => ({ default: m.PermissionsEditorTab }),
    ),
);

const CategoryBehaviourSettings = React.lazy(() =>
    import('@/features/servers/settings/CategoryBehaviourSettings').then(
        (m) => ({ default: m.CategoryBehaviourSettings }),
    ),
);

interface CategorySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export const CategorySettingsModal = ({
    isOpen,
    onClose,
    category,
}: CategorySettingsModalProps) => {
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
                <CategorySettingsSidebar
                    activeSection={activeSection}
                    categoryName={category.name}
                    setActiveSection={handleSetSection}
                />
            }
            onClose={onClose}
            onMobileBackClick={(): void => {
                setIsMobileSidebarOpen(true);
            }}
        >
            <React.Suspense fallback={null}>
                {activeSection === 'overview' ? (
                    <SettingsContentPane>
                        <CategoryOverviewSettings
                            category={category}
                            onDeleted={onClose}
                        />
                    </SettingsContentPane>
                ) : activeSection === 'behaviour' ? (
                    <SettingsContentPane>
                        <CategoryBehaviourSettings category={category} />
                    </SettingsContentPane>
                ) : (
                    <div className="flex h-full flex-1 flex-col overflow-hidden">
                        <PermissionsEditorTab
                            serverId={category.serverId}
                            targetId={category.id}
                            targetType="category"
                        />
                    </div>
                )}
            </React.Suspense>
        </SettingsModalLayout>
    );
};
