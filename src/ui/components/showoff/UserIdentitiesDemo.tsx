import React from 'react';

import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const UserIdentitiesDemo: React.FC = () => {
    // Mock users
    const mockUsers: Record<string, User> = {
        normal: {
            _id: '1',
            username: 'NormalUser',
            login: 'normal',
            createdAt: new Date(),
        } as User,
        glowing: {
            _id: '2',
            username: 'Glowing',
            login: 'glow',
            usernameGlow: { enabled: true, color: '#3b82f6' },
            createdAt: new Date(),
        } as User,
        gradient: {
            _id: '3',
            username: 'Gayass',
            login: 'rainbow',
            usernameGradient: {
                enabled: true,
                colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
                angle: 90,
            },
            createdAt: new Date(),
        } as User,
        fancy: {
            _id: '4',
            username: 'Average british person',
            login: 'fancy',
            usernameFont: 'cursive',
            usernameGradient: {
                enabled: true,
                colors: ['#ff00ff', '#00ffff'],
                angle: 45,
            },
            usernameGlow: { enabled: true, color: '#ffffff' },
            createdAt: new Date(),
        } as User,
    };

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.userIdentities}
            title="User Identities & Avatars"
        >
            <DemoItem id="avatar-sizes" title="Avatar Sizes">
                <div className="flex items-end gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <UserProfilePicture
                            username="Small"
                            size="sm"
                            status="online"
                            src="https://catfla.re/images/servals/serval-1.jpg"
                        />
                        <span className="text-xs text-foreground-muted">
                            sm (32px)
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <UserProfilePicture
                            username="Medium"
                            size="md"
                            status="offline"
                            src="https://catfla.re/images/servals/serval-2.jpg"
                        />
                        <span className="text-xs text-foreground-muted">
                            md (40px)
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <UserProfilePicture
                            username="Large"
                            size="lg"
                            status="online"
                            src="https://catfla.re/images/servals/serval-3.jpg"
                        />
                        <span className="text-xs text-foreground-muted">
                            lg (48px)
                        </span>
                    </div>
                </div>
            </DemoItem>

            <DemoItem
                id="avatar-placeholders"
                title="Avatar Placeholders (Initials)"
            >
                <div className="flex gap-4">
                    <UserProfilePicture username="Antigravity" size="md" />
                    <UserProfilePicture username="John Doe" size="md" />
                    <UserProfilePicture username="System Admin" size="md" />
                </div>
            </DemoItem>

            <DemoItem id="styled-usernames" title="Styled Usernames">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-muted w-24">
                            Default:
                        </span>
                        <StyledUserName user={mockUsers.normal}>
                            NormalUser
                        </StyledUserName>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-muted w-24">
                            Glow:
                        </span>
                        <StyledUserName user={mockUsers.glowing}>
                            {mockUsers.glowing.username}
                        </StyledUserName>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-muted w-24">
                            Gradient:
                        </span>
                        <StyledUserName user={mockUsers.gradient}>
                            {mockUsers.gradient.username}
                        </StyledUserName>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-muted w-24">
                            The Full Lux:
                        </span>
                        <StyledUserName user={mockUsers.fancy}>
                            {mockUsers.fancy.username}
                        </StyledUserName>
                    </div>
                </div>
            </DemoItem>
        </DemoSection>
    );
};
