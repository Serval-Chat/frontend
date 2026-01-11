import React, { useRef, useState } from 'react';

import type { User } from '@/api/users/users.types';
import { UserItem } from '@/ui/components/common/UserItem';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const UserProfilePopupDemo: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const mockUser: User = {
        _id: 'mock-1',
        username: 'catflare',
        displayName: 'Catflare',
        login: 'nekoflare',
        profilePicture: 'https://catfla.re/images/servals/serval-1.jpg',
        banner: 'https://catfla.re/images/servals/serval-banner.jpg',
        bio: 'I love servals! They are so cute and big. \n\nWorking on Serchat, the most beautiful chat app.',
        pronouns: 'she/her',
        badges: [
            {
                _id: 'bad-1',
                id: 'early_supporter',
                name: 'Early Supporter',
                description: 'Supported the project in its early stages.',
                icon: 'heart',
                color: '#FF6B6B',
                createdAt: new Date().toISOString(),
            },
            {
                _id: 'bad-2',
                id: 'developer',
                name: 'Developer',
                description:
                    'Core developer of Serchat or other Serchat related things.',
                icon: 'code_brackets',
                color: '#FFA348',
                createdAt: new Date().toISOString(),
            },
            {
                _id: 'bad-3',
                id: 'serval_enthusiast',
                name: 'Serval Enthusiast',
                description: 'Really, really likes servals.',
                icon: 'cat',
                color: '#FFD93D',
                createdAt: new Date().toISOString(),
            },
        ],
        customStatus: {
            text: 'Sleeping in a sunbeam...',
            emoji: '🐱',
        },
        createdAt: new Date('2024-01-01'),
        usernameGradient: {
            enabled: true,
            colors: ['#FFD700', '#FFA500'],
            angle: 45,
        },
    } as User;

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.userProfilePopup}
            title="User Profile Popup"
        >
            <DemoItem id="profile-popup-direct" title="Direct Popup Trigger">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-foreground-muted mb-2">
                        Click the button below to see the profile popup with
                        complete mock data.
                    </p>
                    <button
                        ref={triggerRef}
                        onClick={() => setIsPopupOpen(true)}
                        className="w-fit px-4 py-2 bg-[var(--color-primary)] text-black font-semibold rounded-md hover:opacity-90 transition-opacity"
                    >
                        Show Mock Profile
                    </button>

                    <ProfilePopup
                        userId={mockUser._id}
                        user={mockUser}
                        isOpen={isPopupOpen}
                        onClose={() => setIsPopupOpen(false)}
                        triggerRef={triggerRef}
                        joinedAt={new Date('2024-05-20').toISOString()}
                        disableFetch={true}
                    />
                </div>
            </DemoItem>

            <DemoItem
                id="profile-popup-context"
                title="Context Menu Integration"
            >
                <div className="flex flex-col gap-4 max-w-sm">
                    <p className="text-sm text-foreground-muted mb-2">
                        Right-click these user items to see the "Show Profile"
                        option.
                    </p>
                    <UserItem
                        userId={mockUser._id}
                        user={mockUser}
                        noFetch={true}
                        allRoles={[
                            {
                                _id: 'role-1',
                                name: 'Admin',
                                color: '#FF0000',
                                position: 0,
                                serverId: 's1',
                            },
                            {
                                _id: 'role-2',
                                name: 'Moderator',
                                color: '#00FF00',
                                position: 1,
                                serverId: 's1',
                            },
                            {
                                _id: 'role-3',
                                name: 'idk',
                                color: null,
                                colors: ['#6b6cc2', '#c300ff'],
                                position: 2,
                                serverId: 's1',
                            },
                        ]}
                    />
                    <UserItem
                        userId="mock-2"
                        user={
                            {
                                _id: 'mock-2',
                                username: 'RegularUser',
                                createdAt: new Date(),
                                customStatus: { text: 'Just chilling' },
                            } as User
                        }
                        noFetch={true}
                    />
                </div>
            </DemoItem>
        </DemoSection>
    );
};
