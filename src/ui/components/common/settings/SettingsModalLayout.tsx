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
        className="bg-background"
        isOpen={isOpen}
        showCloseButton={false}
        onClose={onClose}
    >
        <div className="relative flex h-full w-full">
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
                    'relative flex h-full flex-1 flex-col overflow-hidden bg-background',
                    isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                )}
            >
                {/* Mobile Header Bar */}
                {!isMobileSidebarOpen && onMobileBackClick && (
                    <div className="sticky top-0 z-40 flex shrink-0 items-center border-b border-border-subtle bg-background px-4 py-3 md:hidden">
                        <button
                            className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                        'absolute top-6 z-50 transition-all duration-300 md:top-8',
                        closeButtonOffsetClass || 'right-6 md:right-12',
                    )}
                >
                    <div className="flex flex-col items-center gap-2">
                        <IconButton
                            className="rounded-full border-2 border-border-subtle p-2 text-muted-foreground transition-all duration-200 hover:bg-bg-subtle hover:text-foreground"
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
