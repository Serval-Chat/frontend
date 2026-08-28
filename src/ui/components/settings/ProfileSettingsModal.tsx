import { useState } from 'react';

import { ChevronLeft, Globe, Sparkles, User } from 'lucide-react';

import { useMe } from '@/api/users/users.queries';
import type { User as UserType } from '@/api/users/users.types';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { ModalCloseButton } from '@/ui/components/common/ModalCloseButton';
import { cn } from '@/utils/cn';

import { AccountSettings } from './AccountSettings';
import { AvatarDecorationPicker } from './AvatarDecorationPicker';
import { AvatarDecorationsSettings } from './AvatarDecorationsSettings';
import { GroupedSidebarNav, type GroupedNavSection } from './GroupedSidebarNav';
import { ProfileColorsPicker } from './ProfileColorsPicker';
import { UsernameStylePicker } from './UsernameStylePicker';
import { WebsiteConnectionsSettings } from './WebsiteConnectionsSettings';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PROFILE_SECTIONS: GroupedNavSection[] = [
    { id: 'profile', label: 'Profile', icon: User, category: 'Profile' },
    {
        id: 'decorations',
        label: 'Decoration Creator',
        icon: Sparkles,
        category: 'Profile',
    },
    {
        id: 'connections',
        label: 'Connections',
        icon: Globe,
        category: 'Profile',
    },
];

const ProfileSettingsContent = ({
    user,
    activeSection,
}: {
    user: UserType;
    activeSection: string;
}) => (
    <>
        {activeSection === 'profile' ? (
            <div className="flex flex-col gap-8 xl:flex-row">
                <div className="min-w-0 flex-1">
                    <AccountSettings />
                </div>
                <div className="flex w-full flex-col gap-6 xl:w-[30rem]">
                    <div className="grid grid-cols-3 gap-4">
                        <UsernameStylePicker
                            className="col-span-2"
                            user={user}
                        />
                        <AvatarDecorationPicker />
                    </div>
                    <ProfileColorsPicker user={user} />
                </div>
            </div>
        ) : null}
        {activeSection === 'decorations' ? (
            <AvatarDecorationsSettings />
        ) : null}
        {activeSection === 'connections' ? (
            <WebsiteConnectionsSettings />
        ) : null}
    </>
);

export const ProfileSettingsModal = ({
    isOpen,
    onClose,
}: ProfileSettingsModalProps) => {
    const { data: me } = useMe();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('profile');

    const handleSetSection = (sectionId: string): void => {
        setActiveSection(sectionId);
        setIsMobileSidebarOpen(false);
    };

    return (
        <Modal
            mobileFullScreen
            noPadding
            className="flex flex-row overflow-hidden bg-background p-0 md:h-[92vh] md:max-h-[900px] md:w-[98%] md:max-w-[1500px]"
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
                    <GroupedSidebarNav
                        activeSection={activeSection}
                        sections={PROFILE_SECTIONS}
                        setActiveSection={handleSetSection}
                        title="My Profile"
                        onClose={onClose}
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
                                    onClick={(): void => {
                                        setIsMobileSidebarOpen(true);
                                    }}
                                />
                            </div>
                            <Heading
                                className="m-0"
                                level={2}
                                variant="section"
                            >
                                My Profile
                            </Heading>
                        </div>
                        <ModalCloseButton onClick={onClose} />
                    </div>

                    <div className="scrollbar-thin scrollbar-thumb-bg-secondary scrollbar-track-transparent flex-1 overflow-y-auto p-6">
                        {me ? (
                            <ProfileSettingsContent
                                activeSection={activeSection}
                                user={me}
                            />
                        ) : (
                            <div className="flex min-h-[240px] flex-1 items-center justify-center">
                                <LoadingSpinner size="lg" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
