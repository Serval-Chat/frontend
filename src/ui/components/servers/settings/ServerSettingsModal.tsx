import React, { useState } from 'react';

import { X } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';
import { Modal } from '@/ui/components/common/Modal';
import { cn } from '@/utils/cn';

import { ServerBehaviourSettings } from './ServerBehaviourSettings';
import { ServerEmojiSettings } from './ServerEmojiSettings';
import { ServerInviteSettings } from './ServerInviteSettings';
import { ServerOverviewSettings } from './ServerOverviewSettings';
import { ServerRoleSettings } from './ServerRoleSettings';
import { ServerSettingsSidebar } from './ServerSettingsSidebar';

interface ServerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    serverId: string;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
    isOpen,
    onClose,
    serverId,
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
                <ServerSettingsSidebar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                />
                {/* Content Area */}
                <div className="flex-1 bg-[var(--color-background)] flex flex-col h-full overflow-hidden relative">
                    {/* Close Button Top Right */}
                    <div
                        className={cn(
                            'absolute top-8 z-50 transition-all duration-300',
                            activeSection === 'roles' ? 'right-80' : 'right-12',
                        )}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <IconButton
                                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg-subtle)] border-2 border-[var(--color-border-subtle)] rounded-full p-2 transition-all duration-200"
                                icon={X}
                                iconSize={24}
                                onClick={onClose}
                            />
                            <span className="text-[10px] font-bold text-[var(--color-muted-foreground)] uppercase">
                                Esc
                            </span>
                        </div>
                    </div>
                    <div
                        className={cn(
                            'flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-bg-secondary)] scrollbar-track-transparent',
                            activeSection !== 'roles' && 'p-12',
                        )}
                    >
                        <div
                            className={cn(
                                'mx-auto h-full',
                                activeSection === 'roles'
                                    ? 'max-w-none'
                                    : 'max-w-4xl',
                            )}
                        >
                            {activeSection === 'overview' && (
                                <ServerOverviewSettings serverId={serverId} />
                            )}
                            {activeSection === 'roles' && (
                                <ServerRoleSettings serverId={serverId} />
                            )}
                            {activeSection === 'emojis' && (
                                <ServerEmojiSettings serverId={serverId} />
                            )}
                            {activeSection === 'invites' && (
                                <ServerInviteSettings serverId={serverId} />
                            )}
                            {activeSection === 'behaviour' && (
                                <ServerBehaviourSettings serverId={serverId} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
