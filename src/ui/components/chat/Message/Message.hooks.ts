import React from 'react';

import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { usePermissions } from '@/hooks/usePermissions';
import type { ProcessedChatMessage } from '@/types/chat.ui';

export function useMessageData(
    message: ProcessedChatMessage,
    initialUser: User,
): {
    user: User;
    me: User | undefined;
    isServerMessage: boolean;
    members: ServerMember[] | undefined;
    serverRoles: Role[] | undefined;
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
    const { data: fetchedUser } = useUserById(initialUser._id, {
        enabled: isUnknownUser,
    });
    const user = isUnknownUser && fetchedUser ? fetchedUser : initialUser;

    const { data: me } = useMe();
    const isServerMessage =
        !!message.serverId &&
        (message.serverId === 'preview' ||
            /^[a-f\d]{24}$/i.test(message.serverId));
    const { data: membersRaw } = useMembers(
        isServerMessage ? message.serverId! : null,
        { enabled: isServerMessage },
    );
    const { data: serverRolesRaw } = useRoles(
        isServerMessage ? message.serverId! : null,
        { enabled: isServerMessage },
    );
    const { data: serverDetailsRaw } = useServerDetails(
        isServerMessage ? message.serverId! : null,
        { enabled: isServerMessage },
    );

    const members = React.useDeferredValue(membersRaw);
    const serverRoles = React.useDeferredValue(serverRolesRaw);
    const serverDetails = React.useDeferredValue(serverDetailsRaw);

    const senderMember = React.useMemo(
        () => members?.find((m) => m.userId === message.senderId),
        [members, message.senderId],
    );
    const senderRoles = React.useMemo(() => {
        if (!senderMember || !serverRoles) return undefined;
        return serverRoles.filter((r) => senderMember.roles.includes(r._id));
    }, [senderMember, serverRoles]);

    const { hasPermission, isOwner } = usePermissions(
        isServerMessage ? message.serverId! : null,
        null,
        { enabled: isServerMessage },
    );

    const myId = me?._id;
    const mentionsMe = React.useMemo(() => {
        if (!myId) return false;

        if (message.text.includes(`<userid:'${myId}'>`)) return true;

        if (message.text.includes('<everyone>')) return true;

        const myMember = members?.find((m) => m.userId === myId);
        if (
            myMember &&
            myMember.roles.some((roleId) =>
                message.text.includes(`<roleid:'${roleId}'>`),
            )
        ) {
            return true;
        }

        return false;
    }, [message.text, myId, members]);

    const interactionUser = React.useMemo(() => {
        if (!message.interaction?.user?.id || !members) return undefined;
        const member = members.find(
            (m) => m.userId === message.interaction!.user!.id,
        );
        if (!member) return undefined;
        return {
            ...member.user,
            _id: member.userId,
            username:
                member.user.username || message.interaction!.user.username,
            displayName: member.user.displayName,
            profilePicture: member.user.profilePicture,
            bannerColor: member.user.bannerColor,
            usernameGradient: member.user.usernameGradient,
            isBot: member.user.isBot,
        } as unknown as User;
    }, [message.interaction, members]);

    const interactionRole = React.useMemo(() => {
        if (!message.interaction?.user?.id || !members || !serverRoles)
            return undefined;
        const member = members.find(
            (m) => m.userId === message.interaction!.user!.id,
        );
        if (!member || !member.roles.length) return undefined;

        const roles = serverRoles.filter((r) => member.roles.includes(r._id));
        if (!roles.length) return undefined;

        return roles.sort((a, b) => b.position - a.position)[0];
    }, [message.interaction, members, serverRoles]);

    return {
        user,
        me,
        isServerMessage,
        members,
        serverRoles,
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
