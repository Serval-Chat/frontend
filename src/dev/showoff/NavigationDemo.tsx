import type { Friend } from '@/api/friends/friends.types';
import type { Server } from '@/api/servers/servers.types';
import { ServerIcon } from '@/features/servers/ServerIcon';
import { ServerItem } from '@/features/servers/ServerItem';
import { UserItem } from '@/features/users/UserItem';
import { Text } from '@/ui/primitives/Text';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

const mockServer: Server = {
    id: '1',
    name: "Catflare's Hideout",
    icon: undefined,
    ownerId: 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const mockFriend: Friend = {
    id: '1',
    username: 'catflare',
    displayName: 'Cat Flare',
    profilePicture: null,
    createdAt: new Date().toISOString(),
    customStatus: { text: 'Developing awesome stuff', emoji: '🐈' },
};

export const NavigationDemo = () => (
    <DemoSection id={SHOWOFF_SECTIONS.navigation} title="Navigation Components">
        <DemoItem id="server-icons" title="Server Icons & Primary Nav">
            <div className="flex w-fit items-center gap-4 rounded-xl bg-[--color-bg-secondary] p-4">
                <div className="flex flex-col items-center gap-1">
                    <ServerIcon server={mockServer} />
                    <Text className="text-[10px]" variant="muted">
                        Default
                    </Text>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ServerIcon isActive server={mockServer} />
                    <Text className="text-[10px]" variant="muted">
                        Active
                    </Text>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ServerIcon
                        server={{
                            ...mockServer,
                            icon: 'https://catfla.re/images/servals/serval-1.jpg',
                        }}
                    />
                    <Text className="text-[10px]" variant="muted">
                        With Icon
                    </Text>
                </div>
            </div>
        </DemoItem>

        <DemoItem
            id={SHOWOFF_SECTIONS.serverItems}
            title="Server Items (read & unread)"
        >
            <div className="flex w-20 flex-col items-center gap-3 rounded-xl bg-[--color-bg-secondary] p-3">
                <div className="flex flex-col items-center gap-1">
                    <ServerItem
                        isActive={false}
                        isUnread={false}
                        server={mockServer}
                    />
                    <Text className="text-[10px]" variant="muted">
                        Read
                    </Text>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ServerItem isActive isUnread={false} server={mockServer} />
                    <Text className="text-[10px]" variant="muted">
                        Read (active)
                    </Text>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ServerItem isUnread isActive={false} server={mockServer} />
                    <Text className="text-[10px]" variant="muted">
                        Unread
                    </Text>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ServerItem isActive isUnread server={mockServer} />
                    <Text className="text-[10px]" variant="muted">
                        Unread (active)
                    </Text>
                </div>
            </div>
        </DemoItem>

        <DemoItem id="friend-items" title="Friend List Items (Secondary Nav)">
            <div className="flex w-60 flex-col gap-1 rounded-lg bg-[--color-bg-secondary] p-2">
                <UserItem
                    noFetch
                    initialData={mockFriend}
                    userId={mockFriend.id}
                />
                <UserItem
                    isActive
                    noFetch
                    initialData={{
                        ...mockFriend,
                        username: 'other',
                        displayName: 'Electrode',
                    }}
                    userId="2"
                />
                <UserItem
                    noFetch
                    initialData={{
                        ...mockFriend,
                        username: 'longname',
                        displayName:
                            'A Very Long Username That Should Truncate Beautifully In The Sidebar',
                    }}
                    userId="3"
                />
            </div>
        </DemoItem>
    </DemoSection>
);
