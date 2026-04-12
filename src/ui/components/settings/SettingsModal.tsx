import React, { useState } from 'react';

import { ChevronLeft, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { cn } from '@/utils/cn';

import { AccessibilitySettings } from './AccessibilitySettings';
import { AccountSettings } from './AccountSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { BlockingSettings } from './BlockingSettings';
import { DeveloperSettings } from './DeveloperSettings';
import { SettingsSidebar } from './SettingsSidebar';
import { StandingSettings } from './StandingSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTION_URL_MAP: Record<string, string> = {
    'my-account': 'account',
    appearance: 'appearance',
    accessibility: 'accessibility',
    blocking: 'blocking',
    standing: 'standing',
    developer: 'developer',
};

const SECTION_ID_TO_URL: Record<string, string> = {
    account: 'my-account',
    appearance: 'appearance',
    accessibility: 'accessibility',
    blocking: 'blocking',
    standing: 'standing',
    developer: 'developer',
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
            className="flex h-[92vh] max-h-[900px] w-[96%] max-w-[1200px] flex-row overflow-hidden bg-background p-0"
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
                        'relative flex h-full flex-1 flex-col overflow-hidden bg-background',
                        isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                    )}
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-6 py-5">
                        <div className="flex items-center gap-2">
                            <div className="md:hidden">
                                <IconButton
                                    className="text-muted-foreground hover:bg-bg-subtle hover:text-foreground"
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
                            className="border border-border-subtle text-muted-foreground hover:bg-danger-muted hover:text-danger"
                            icon={X}
                            iconSize={20}
                            onClick={onClose}
                        />
                    </div>

                    <div className="scrollbar-thin scrollbar-thumb-bg-secondary scrollbar-track-transparent flex-1 overflow-y-auto p-6">
                        {activeSection === 'account' && <AccountSettings />}
                        {activeSection === 'appearance' && (
                            <AppearanceSettings />
                        )}
                        {activeSection === 'accessibility' && (
                            <AccessibilitySettings />
                        )}
                        {activeSection === 'blocking' && <BlockingSettings />}
                        {activeSection === 'standing' && <StandingSettings />}
                        {activeSection === 'developer' && <DeveloperSettings />}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
