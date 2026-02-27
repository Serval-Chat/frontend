import React, { useState } from 'react';

import { X } from 'lucide-react';

import { type Category } from '@/api/servers/servers.types';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { CategoryOverviewSettings } from '@/ui/components/servers/settings/CategoryOverviewSettings';
import { CategorySettingsSidebar } from '@/ui/components/servers/settings/CategorySettingsSidebar';

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
        <Modal
            fullScreen
            noPadding
            className="bg-[var(--color-background)]"
            isOpen={isOpen}
            showCloseButton={false}
            onClose={onClose}
        >
            <div className="flex h-full w-full relative">
                {/* Navigation Sidebar */}
                <CategorySettingsSidebar
                    activeSection={activeSection}
                    categoryName={category.name}
                    setActiveSection={setActiveSection}
                />

                {/* Content Area */}
                <div className="flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative">
                    {/* Close Button Top Right */}
                    <div className="absolute top-8 right-12 z-50">
                        <div className="flex flex-col items-center gap-2">
                            <IconButton
                                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg-subtle)] border-2 border-[var(--color-border-subtle)] rounded-full p-2 transition-all duration-200"
                                icon={X}
                                iconSize={24}
                                onClick={onClose}
                            />
                            <Text
                                size="2xs"
                                transform="uppercase"
                                variant="muted"
                                weight="bold"
                            >
                                Esc
                            </Text>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-bg-secondary)] scrollbar-track-transparent p-12">
                        <div className="mx-auto max-w-4xl h-full">
                            {activeSection === 'overview' && (
                                <CategoryOverviewSettings
                                    category={category}
                                    onDeleted={onClose}
                                />
                            )}
                            {activeSection === 'permissions' && (
                                <div className="text-[var(--color-muted-foreground)]">
                                    Permissions settings for individual
                                    categories coming soon.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
