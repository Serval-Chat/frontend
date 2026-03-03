import React from 'react';

import { ChevronLeft, X } from 'lucide-react';

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
    isMobileSidebarOpen?: boolean;
    onMobileBackClick?: () => void;
}

export const SettingsModalLayout: React.FC<SettingsModalLayoutProps> = ({
    isOpen,
    onClose,
    sidebar,
    children,
    closeButtonOffsetClass,
    isMobileSidebarOpen = true,
    onMobileBackClick,
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
            <div
                className={cn(
                    'h-full shrink-0',
                    isMobileSidebarOpen
                        ? 'w-full md:w-auto'
                        : 'hidden md:block',
                )}
            >
                {sidebar}
            </div>

            {/* Content Area */}
            <div
                className={cn(
                    'flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative',
                    isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                )}
            >
                {/* Mobile Header Bar */}
                {!isMobileSidebarOpen && onMobileBackClick && (
                    <div className="md:hidden flex items-center sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-subtle)] px-4 py-3 shrink-0">
                        <button
                            className="flex items-center gap-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] font-medium transition-colors"
                            onClick={onMobileBackClick}
                        >
                            <ChevronLeft size={20} />
                            Back
                        </button>
                    </div>
                )}

                {/* Close Button Top Right */}
                <div
                    className={cn(
                        'absolute top-6 md:top-8 z-50 transition-all duration-300',
                        closeButtonOffsetClass || 'right-6 md:right-12',
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
