import React, { useState } from 'react';

import { X } from 'lucide-react';

import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';

import { AccountSettings } from './AccountSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SettingsSidebar } from './SettingsSidebar';
import { StandingSettings } from './StandingSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [activeSection, setActiveSection] = useState<string>('account');

    // Reset section when modal opens (adjusting state during render)
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setActiveSection('account');
        }
    }

    return (
        <Modal
            noPadding
            className="w-[96%] max-w-[1200px] h-[92vh] max-h-[900px] bg-[var(--color-background)] p-0 flex flex-row overflow-hidden"
            isOpen={isOpen}
            showCloseButton={false}
            onClose={onClose}
        >
            <div className="flex h-full w-full">
                <SettingsSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                />

                <div className="flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)] shrink-0">
                        <Heading className="m-0" level={2} variant="section">
                            Settings
                        </Heading>
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
