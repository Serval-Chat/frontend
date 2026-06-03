import React from 'react';

import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';

export function useMessageData(
    message: ProcessedChatMessage,
    initialUser: User,
    data?: {
        me?: User;
        serverDetails?: Server;
        senderMember?: ServerMember;
        senderRoles?: Role[];
        hasPermission?: (permission: keyof RolePermissions) => boolean;
        isOwner?: boolean;
        fullMemberMap?: Map<string, ServerMember>;
        roleMap?: Map<string, Role>;
    },
): {
    user: User;
    me: User | undefined;
    serverDetails: Server | undefined;
    senderMember: ServerMember | undefined;
    senderRoles: Role[] | undefined;
    hasPermission: (permission: keyof RolePermissions) => boolean;
    isOwner: boolean;
    mentionsMe: boolean;
    interactionUser: User | undefined;
    interactionRole: Role | undefined;
} {
    const isUnknownUser = initialUser.username === 'Unknown';
    const { data: fetchedUser } = useUserById(initialUser.id, {
        enabled: isUnknownUser,
    });
    let user = isUnknownUser && fetchedUser ? fetchedUser : initialUser;

    if (data?.senderMember?.nickname) {
        user = { ...user, nickname: data.senderMember.nickname };
    } else if (data?.fullMemberMap?.has(user.id)) {
        const member = data.fullMemberMap.get(user.id);
        if (member?.nickname) {
            user = { ...user, nickname: member.nickname };
        }
    }

    const me = data?.me;
    const serverDetails = data?.serverDetails;
    const senderMember = data?.senderMember;
    const senderRoles = data?.senderRoles;

    const hasPermission = React.useMemo(
        (): ((permission: keyof RolePermissions) => boolean) =>
            data?.hasPermission ?? ((): false => false),
        [data?.hasPermission],
    );
    const isOwner = !!data?.isOwner;

    const fullMemberMap = data?.fullMemberMap;
    const roleMap = data?.roleMap;

    const myId = me?.id;
    const mentionsMe = React.useMemo((): boolean => {
        if (!myId) return false;

        if (message.text.includes(`<userid:'${myId}'>`)) return true;

        if (message.text.includes('<everyone>')) return true;

        const myMember = fullMemberMap?.get(myId);
        if (
            myMember &&
            myMember.roles.some((roleId): boolean =>
                message.text.includes(`<roleid:'${roleId}'>`),
            )
        ) {
            return true;
        }

        return false;
    }, [message.text, myId, fullMemberMap]);

    const interactionUser = React.useMemo((): User | undefined => {
        if (!message.interaction?.user?.id || !fullMemberMap) return undefined;
        const member = fullMemberMap.get(message.interaction!.user!.id);
        if (!member) return undefined;
        return {
            ...member.user,
            id: member.userId,
            username:
                member.user.username || message.interaction!.user.username,
            displayName: member.user.displayName,
            nickname: member.nickname,
            profilePicture: member.user.profilePicture,
            bannerColor: member.user.bannerColor,
            usernameGradient: member.user.usernameGradient,
            isBot: member.user.isBot,
        } as unknown as User;
    }, [message.interaction, fullMemberMap]);

    const interactionRole = React.useMemo((): Role | undefined => {
        if (!message.interaction?.user?.id || !fullMemberMap || !roleMap)
            return undefined;
        const member = fullMemberMap.get(message.interaction!.user!.id);
        if (!member || !member.roles.length) return undefined;

        const roles = member.roles
            .map((id): Role | undefined => roleMap.get(id))
            .filter((r): r is Role => !!r);
        if (!roles.length) return undefined;

        return roles.sort((a, b): number => b.position - a.position)[0];
    }, [message.interaction, fullMemberMap, roleMap]);

    return {
        user,
        me,
        serverDetails,
        senderMember,
        senderRoles,
        hasPermission,
        isOwner,
        mentionsMe,
        interactionUser,
        interactionRole,
    };
}

export function useMessagePermissions(
    message: ProcessedChatMessage,
    isMessageSender: boolean,
    isOwner: boolean,
    hasPermission: (perm: keyof RolePermissions) => boolean,
): { canEdit: boolean; canDelete: boolean; canPin: boolean } {
    const canEdit = isMessageSender && !message.deletedAt;

    const canDelete =
        !message.deletedAt &&
        (isMessageSender ||
            isOwner ||
            hasPermission('administrator') ||
            hasPermission('manageMessages') ||
            hasPermission('deleteMessagesOfOthers'));

    const canPin =
        !message.deletedAt &&
        (hasPermission('administrator') || hasPermission('pinMessages'));

    return { canEdit, canDelete, canPin };
}
