import {
    Ban,
    Check,
    MessageSquare,
    PanelBottomOpen,
    PanelLeftOpen,
    PanelRightOpen,
    PanelTopOpen,
    PanelsLeftRight,
    Pin,
    PinOff,
    Shield,
    Tag,
    UserMinus,
    UserPlus,
    UserX,
    Volume2,
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import type { AppDispatch } from '@/store';
import { setSplitViewPane } from '@/store/slices/navSlice';
import { setUserVolume } from '@/store/slices/voiceSlice';
import { Box } from '@/ui/primitives/Box';
import type { ContextMenuItem } from '@/ui/primitives/ContextMenu';
import { Slider } from '@/ui/primitives/Slider';
import { Text } from '@/ui/primitives/Text';
import { wsMessages } from '@/ws/messages';

export const buildDmItems = ({
    userId,
    isMobile,
    isPinnedFriend,
    hasNickname,
    hasUnread,
    canInviteToAnyServer,
    dispatch,
    navigate,
    togglePinFriend,
    openInviteToServer,
    openNickname,
}: {
    userId: string;
    isMobile: boolean | null;
    isPinnedFriend: boolean;
    hasNickname: boolean;
    hasUnread: boolean;
    canInviteToAnyServer: boolean;
    dispatch: AppDispatch;
    navigate: NavigateFunction;
    togglePinFriend: (userId: string) => void;
    openInviteToServer: () => void;
    openNickname: () => void;
}): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
        { type: 'divider' },
        {
            label: 'Open DMs',
            icon: MessageSquare,
            onClick: (): void => {
                void navigate(`/chat/@user/${userId}`);
            },
        },
    ];
    if (canInviteToAnyServer) {
        items.push({
            label: 'Invite to Server',
            icon: UserPlus,
            onClick: openInviteToServer,
        });
    }
    items.push(
        {
            label: 'Add to Split View',
            type: 'submenu',
            icon: PanelsLeftRight,
            items: [
                {
                    label: isMobile ? 'Top Pane' : 'Left Side',
                    icon: isMobile ? PanelTopOpen : PanelLeftOpen,
                    onClick: (): void => {
                        dispatch(
                            setSplitViewPane({
                                side: 'left',
                                conversation: {
                                    type: 'dm',
                                    friendId: userId,
                                },
                            }),
                        );
                    },
                },
                {
                    label: isMobile ? 'Bottom Pane' : 'Right Side',
                    icon: isMobile ? PanelBottomOpen : PanelRightOpen,
                    onClick: (): void => {
                        dispatch(
                            setSplitViewPane({
                                side: 'right',
                                conversation: {
                                    type: 'dm',
                                    friendId: userId,
                                },
                            }),
                        );
                    },
                },
            ],
        },
        {
            label: isPinnedFriend ? 'Unpin DM' : 'Pin DM',
            icon: isPinnedFriend ? PinOff : Pin,
            onClick: (): void => {
                togglePinFriend(userId);
            },
        },
        {
            label: hasNickname ? 'Edit Nickname' : 'Add Friend Nickname',
            icon: Tag,
            onClick: openNickname,
        },
    );

    if (hasUnread) {
        items.push({
            label: 'Mark as Read',
            icon: Check,
            onClick: (): void => {
                wsMessages.markDmRead(userId);
            },
        });
    }
    return items;
};

export const buildVolumeItems = ({
    userId,
    userVolume,
    dispatch,
}: {
    userId: string;
    userVolume: number | undefined;
    dispatch: AppDispatch;
}): ContextMenuItem[] => {
    const volume = userVolume ?? 1;
    return [
        { type: 'divider' },
        {
            type: 'custom',
            content: (
                <div className="flex flex-col gap-2 p-1">
                    <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <div className="flex items-center gap-1.5">
                            <Volume2 size={12} />
                            User Volume
                        </div>
                        <Text>
                            {Math.round((isNaN(volume) ? 1 : volume) * 100)}%
                        </Text>
                    </div>
                    <Slider
                        aria-label="User volume"
                        className="w-full cursor-pointer accent-primary"
                        max="2"
                        min="0"
                        step="0.01"
                        value={volume}
                        onChange={(e): void => {
                            dispatch(
                                setUserVolume({
                                    userId,
                                    volume: Number.parseFloat(e.target.value),
                                }),
                            );
                        }}
                    />
                </div>
            ),
        },
    ];
};

export const buildRelationshipItems = ({
    isFriend,
    isBot,
    isBlocked,
    removeFriend,
    addFriend,
    unblock,
    block,
}: {
    isFriend: boolean;
    isBot: boolean | undefined;
    isBlocked: boolean | undefined;
    removeFriend: () => void;
    addFriend: () => void;
    unblock: () => void;
    block: () => void;
}): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [{ type: 'divider' }];
    if (isFriend) {
        items.push({
            label: 'Remove Friend',
            icon: UserMinus,
            onClick: removeFriend,
            variant: 'danger',
        });
    } else if (!isBot) {
        items.push({
            label: 'Add Friend',
            icon: UserPlus,
            onClick: addFriend,
        });
    }

    if (isBlocked) {
        items.push({
            label: 'Unblock User',
            icon: Shield,
            onClick: unblock,
        });
    } else {
        items.push({
            label: 'Block User',
            icon: Ban,
            onClick: block,
            variant: 'danger',
        });
    }
    return items;
};

export const buildRolesSubmenu = ({
    userId,
    serverRoles,
    memberRoles,
    isOwner,
    myHighestRole,
    isBusy,
    addRole,
    removeRole,
}: {
    userId: string;
    serverRoles: Role[];
    memberRoles: Role[] | undefined;
    isOwner: boolean;
    myHighestRole: Role | undefined;
    isBusy: boolean;
    addRole: (args: { roleId: string; userId: string }) => void;
    removeRole: (args: { roleId: string; userId: string }) => void;
}): ContextMenuItem => {
    const rolesToDisplay = serverRoles
        .toSorted((a, b): number => b.position - a.position)
        .filter((r): boolean => r.name !== '@everyone');

    return {
        icon: Shield,
        items:
            rolesToDisplay.length > 0
                ? rolesToDisplay.map((r) => {
                      const hasRole = memberRoles?.some(
                          (ur): boolean => String(ur.id) === String(r.id),
                      );

                      // Only roles strictly below your highest role, unless you own the server.
                      const canManageThisRole =
                          isOwner ||
                          (myHighestRole &&
                              myHighestRole.position > r.position);

                      return {
                          indent: false,
                          label: (
                              <Box className="flex items-center gap-2">
                                  <RoleDot role={r} size={8} />
                                  <Text className="truncate">{r.name}</Text>
                              </Box>
                          ),
                          onClick: (): void => {
                              if (isBusy) return;

                              if (hasRole) {
                                  removeRole({ roleId: r.id, userId });
                              } else {
                                  addRole({ roleId: r.id, userId });
                              }
                          },
                          preventClose: true,
                          rightIcon: hasRole ? Check : undefined,
                          type: 'action',
                          variant: canManageThisRole
                              ? isBusy
                                  ? 'ghost'
                                  : 'normal'
                              : 'ghost',
                      };
                  })
                : [
                      {
                          label: 'No roles',
                          onClick: (): void => {},
                          type: 'action',
                          variant: 'ghost',
                      },
                  ],
        label: 'Roles',
        type: 'submenu',
    };
};

export const buildModerationItems = ({
    canTimeout,
    canKick,
    canBan,
    openTimeout,
    openKick,
    openBan,
}: {
    canTimeout: boolean;
    canKick: boolean;
    canBan: boolean;
    openTimeout: () => void;
    openKick: () => void;
    openBan: () => void;
}): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    if (canTimeout) {
        items.push({
            label: 'Timeout Member',
            icon: Shield,
            onClick: openTimeout,
            variant: 'danger',
        });
    }
    if (canKick) {
        items.push({
            label: 'Kick Member',
            icon: UserX,
            onClick: openKick,
            variant: 'danger',
        });
    }
    if (canBan) {
        items.push({
            label: 'Ban Member',
            icon: Ban,
            onClick: openBan,
            variant: 'danger',
        });
    }
    items.push({ type: 'divider' });
    return items;
};
