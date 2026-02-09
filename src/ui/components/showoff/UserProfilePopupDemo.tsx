import React, { useRef, useState } from 'react';

import type { User } from '@/api/users/users.types';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { resolveApiUrl } from '@/utils/apiUrl';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const UserProfilePopupDemo: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const mockUser: User = {
        _id: 'mock-1',
        username: 'catflare',
        displayName: 'Catflare',
        login: 'nekoflare',
        profilePicture: 'https://catfla.re/images/servals/serval-1.jpg',
        banner:
            resolveApiUrl(
                '/api/v1/profile/banner/19f0253d8960f45cc6e9193c3d34e2fb.gif',
            ) || '',
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
                    <Text as="p" className="mb-2" size="sm" variant="muted">
                        Click the button below to see the profile popup with
                        complete mock data.
                    </Text>
                    <div className="w-fit" ref={triggerRef}>
                        <Button
                            className="w-fit px-4 py-2 bg-[var(--color-primary)] text-black font-semibold rounded-md hover:opacity-90 transition-opacity"
                            variant="primary"
                            onClick={() => setIsPopupOpen(true)}
                        >
                            Show Mock Profile
                        </Button>
                    </div>

                    <ProfilePopup
                        disableFetch
                        isOpen={isPopupOpen}
                        joinedAt={new Date('2024-05-20').toISOString()}
                        triggerRef={triggerRef}
                        user={mockUser}
                        userId={mockUser._id}
                        onClose={() => setIsPopupOpen(false)}
                    />
                </div>
            </DemoItem>

            <DemoItem
                id="profile-popup-context"
                title="Context Menu Integration"
            >
                <div className="flex flex-col gap-4 max-w-sm">
                    <Text as="p" className="mb-2" size="sm" variant="muted">
                        Right-click these user items to see the "Show Profile"
                        option.
                    </Text>
                    <UserItem
                        noFetch
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
                        user={mockUser}
                        userId={mockUser._id}
                    />
                    <UserItem
                        noFetch
                        user={
                            {
                                _id: 'mock-2',
                                username: 'RegularUser',
                                createdAt: new Date(),
                                customStatus: { text: 'Just chilling' },
                            } as User
                        }
                        userId="mock-2"
                    />
                </div>
            </DemoItem>
        </DemoSection>
    );
};
