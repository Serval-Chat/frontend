import React, { useState } from 'react';

import { ChevronLeft, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { cn } from '@/utils/cn';

import { AccountSettings } from './AccountSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SettingsSidebar } from './SettingsSidebar';
import { StandingSettings } from './StandingSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTION_URL_MAP: Record<string, string> = {
    'my-account': 'account',
    appearance: 'appearance',
    standing: 'standing',
};

const SECTION_ID_TO_URL: Record<string, string> = {
    account: 'my-account',
    appearance: 'appearance',
    standing: 'standing',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const urlSegment = location.pathname.split('/').pop() ?? '';
    const activeSection = SECTION_URL_MAP[urlSegment] ?? 'account';

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

    const handleSetSection = (sectionId: string): void => {
        setIsMobileSidebarOpen(false);
        const urlPath = SECTION_ID_TO_URL[sectionId] ?? 'my-account';
        void navigate(`/chat/@setting/${urlPath}`, { replace: true });
    };

    return (
        <Modal
            noPadding
            className="w-[96%] max-w-[1200px] h-[92vh] max-h-[900px] bg-[var(--color-background)] p-0 flex flex-row overflow-hidden"
            isOpen={isOpen}
            showCloseButton={false}
            onClose={onClose}
        >
            <div className="flex h-full w-full">
                <div
                    className={cn(
                        'h-full shrink-0',
                        isMobileSidebarOpen
                            ? 'w-full md:w-auto'
                            : 'hidden md:block',
                    )}
                >
                    <SettingsSidebar
                        activeSection={activeSection}
                        setActiveSection={handleSetSection}
                    />
                </div>

                <div
                    className={cn(
                        'flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative',
                        isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                    )}
                >
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)] shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="md:hidden">
                                <IconButton
                                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg-subtle)]"
                                    icon={ChevronLeft}
                                    iconSize={24}
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                />
                            </div>
                            <Heading
                                className="m-0"
                                level={2}
                                variant="section"
                            >
                                Settings
                            </Heading>
                        </div>
                        <IconButton
                            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] border border-[var(--color-border-subtle)]"
                            icon={X}
                            iconSize={20}
                            onClick={onClose}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[var(--color-bg-secondary)] scrollbar-track-transparent">
                        {activeSection === 'account' && <AccountSettings />}
                        {activeSection === 'appearance' && (
                            <AppearanceSettings />
                        )}
                        {activeSection === 'standing' && <StandingSettings />}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
