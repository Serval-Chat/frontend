import React from 'react';

import type { Friend } from '@/api/friends/friends.types';
import type { Server } from '@/api/servers/servers.types';
import { UserItem } from '@/ui/components/common/UserItem';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const NavigationDemo: React.FC = () => {
    const mockServer: Server = {
        _id: '1',
        name: "Catflare's Hideout",
        icon: undefined,
        ownerId: 'owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockFriend: Friend = {
        _id: '1',
        username: 'catflare',
        displayName: 'Cat Flare',
        profilePicture: null,
        createdAt: new Date().toISOString(),
        customStatus: { text: 'Developing awesome stuff', emoji: '🐈' },
    };

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.navigation}
            title="Navigation Components"
        >
            <DemoItem id="server-icons" title="Server Icons & Primary Nav">
                <div className="flex gap-4 items-center bg-[--color-bg-secondary] p-4 rounded-xl w-fit">
                    <div className="flex flex-col items-center gap-1">
                        <ServerIcon server={mockServer} />
                        <span className="text-[10px] text-foreground-muted">
                            Default
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <ServerIcon server={mockServer} isActive />
                        <span className="text-[10px] text-foreground-muted">
                            Active
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <ServerIcon
                            server={{
                                ...mockServer,
                                icon: 'https://catfla.re/images/servals/serval-1.jpg',
                            }}
                        />
                        <span className="text-[10px] text-foreground-muted">
                            With Icon
                        </span>
                    </div>
                </div>
            </DemoItem>

            <DemoItem
                id="friend-items"
                title="Friend List Items (Secondary Nav)"
            >
                <div className="flex flex-col gap-1 w-60 bg-[--color-bg-secondary] p-2 rounded-lg">
                    <UserItem
                        userId={mockFriend._id}
                        initialData={mockFriend}
                        noFetch
                    />
                    <UserItem
                        userId="2"
                        initialData={{
                            ...mockFriend,
                            username: 'other',
                            displayName: 'Electrode',
                        }}
                        isActive
                        noFetch
                    />
                    <UserItem
                        userId="3"
                        initialData={{
                            ...mockFriend,
                            username: 'longname',
                            displayName:
                                'A Very Long Username That Should Truncate Beautifully In The Sidebar',
                        }}
                        noFetch
                    />
                </div>
            </DemoItem>
        </DemoSection>
    );
};
