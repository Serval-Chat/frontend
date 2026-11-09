import { useMemo } from 'react';

import type { Role, ServerMember } from '@/api/servers/servers.types';

interface MemberModerationInput {
    serverRoles: Role[] | undefined;
    myMember: ServerMember | undefined;
    targetMember: ServerMember | undefined;
    ownerId: string | undefined;
    currentUserId: string | undefined;
}

export const useMemberModeration = ({
    serverRoles,
    myMember,
    targetMember,
    ownerId,
    currentUserId,
}: MemberModerationInput) => {
    const myRoles = useMemo(
        (): Role[] | undefined =>
            serverRoles?.filter(
                (r) => myMember?.roles.includes(r.id) || r.name === '@everyone',
            ),
        [serverRoles, myMember?.roles],
    );
    const isOwner = Boolean(ownerId) && ownerId === currentUserId;

    const myHighestRole = useMemo((): Role | undefined => {
        if (!myRoles?.length) return undefined;
        const maxPos = Math.max(...myRoles.map((r): number => r.position));
        return myRoles.find((r): boolean => r.position === maxPos);
    }, [myRoles]);

    const canManageRoles =
        isOwner ||
        (myRoles?.some(
            (r): boolean | undefined =>
                r.permissions?.administrator || r.permissions?.manageRoles,
        ) ??
            false);

    const canKick =
        isOwner ||
        (myRoles?.some(
            (r): boolean | undefined =>
                r.permissions?.administrator || r.permissions?.kickMembers,
        ) ??
            false);

    const canBan =
        isOwner ||
        (myRoles?.some(
            (r): boolean | undefined =>
                r.permissions?.administrator || r.permissions?.banMembers,
        ) ??
            false);

    const canTimeout =
        isOwner ||
        (myRoles?.some(
            (r): boolean | undefined =>
                r.permissions?.administrator || r.permissions?.moderateMembers,
        ) ??
            false);

    const targetRoles = useMemo(
        (): Role[] | undefined =>
            serverRoles?.filter((r) => targetMember?.roles.includes(r.id)),
        [serverRoles, targetMember?.roles],
    );
    const targetHighestRole = useMemo((): Role | undefined => {
        if (!targetRoles?.length) return undefined;
        const maxPos = Math.max(...targetRoles.map((r): number => r.position));
        return targetRoles.find((r): boolean => r.position === maxPos);
    }, [targetRoles]);
    const targetHighestPosition = targetHighestRole
        ? targetHighestRole.position
        : -1;
    const myHighestPosition = myHighestRole ? myHighestRole.position : -1;

    const isHigherHierarchy =
        isOwner || myHighestPosition > targetHighestPosition;

    return {
        isOwner,
        myHighestRole,
        canManageRoles,
        canKick,
        canBan,
        canTimeout,
        isHigherHierarchy,
    };
};
