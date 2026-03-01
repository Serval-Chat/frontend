import React from 'react';

import { X } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface SettingsModalLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    sidebar: React.ReactNode;
    children: React.ReactNode;
    closeButtonOffsetClass?: string;
}

export const SettingsModalLayout: React.FC<SettingsModalLayoutProps> = ({
    isOpen,
    onClose,
    sidebar,
    children,
    closeButtonOffsetClass,
}) => (
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
            {sidebar}

            {/* Content Area */}
            <div className="flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative">
                {/* Close Button Top Right */}
                <div
                    className={cn(
                        'absolute top-8 z-50 transition-all duration-300',
                        closeButtonOffsetClass || 'right-12',
                    )}
                >
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

                {children}
            </div>
        </div>
    </Modal>
);
