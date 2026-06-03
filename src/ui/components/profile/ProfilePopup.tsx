import React, { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAdminUserDetail } from '@/hooks/admin/useAdminUsers';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useAppSelector } from '@/store/hooks';
import { Box } from '@/ui/components/layout/Box';
import {
    getHighestColorRoleForMember,
    getHighestRoleWithIconForMember,
} from '@/ui/utils/chat';

import { UserProfileCard } from './UserProfileCard';

interface ProfilePopupProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    triggerRef?: React.RefObject<HTMLElement | null>;
    user?: User;
    role?: Role;
    iconRole?: Role;
    roles?: Role[];
    joinedAt?: string;
    disableFetch?: boolean;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    adminView?: boolean;
    serverId?: string;
}

export const ProfilePopup = (props: ProfilePopupProps): React.ReactPortal =>
    createPortal(
        <AnimatePresence>
            {props.isOpen && (
                <ProfilePopupContent
                    adminView={props.adminView}
                    disableColors={props.disableColors}
                    disableCustomFonts={props.disableCustomFonts}
                    disableFetch={props.disableFetch}
                    disableGlow={props.disableGlow}
                    disableGlowAndColors={props.disableGlowAndColors}
                    iconRole={props.iconRole}
                    isOpen={props.isOpen}
                    joinedAt={props.joinedAt}
                    position={props.position}
                    role={props.role}
                    roles={props.roles}
                    serverId={props.serverId}
                    triggerRef={props.triggerRef}
                    user={props.user}
                    userId={props.userId}
                    onClose={props.onClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );

const ProfilePopupContent = ({
    userId,
    onClose,
    position,
    triggerRef,
    user: providedUser,
    role,
    iconRole,
    roles,
    joinedAt,
    disableFetch,
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    adminView = false,
    serverId,
}: ProfilePopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);

    const { data: fetchedUser } = useUserById(userId, {
        enabled: !disableFetch && !adminView,
    });
    const { data: adminData } = useAdminUserDetail(adminView ? userId : null);
    const { data: members } = useMembers(serverId || null, {
        enabled: !!serverId,
    });
    const { data: serverRoles } = useRoles(serverId || null, {
        enabled: !!serverId,
    });
    const { data: serverDetails } = useServerDetails(serverId || null, {
        enabled: !!serverId,
    });

    const member = React.useMemo(
        () => members?.find((m): boolean => m.userId === userId),
        [members, userId],
    );

    const finalRoles = React.useMemo((): Role[] | undefined => {
        if (roles) return roles;
        if (!member || !serverRoles) return undefined;
        return serverRoles.filter((r) => member.roles.includes(r.id));
    }, [roles, member, serverRoles]);

    const roleMap = React.useMemo((): Map<string, Role> => {
        const map = new Map<string, Role>();
        serverRoles?.forEach((r): Map<string, Role> => map.set(r.id, r));
        return map;
    }, [serverRoles]);

    const resolvedRole = React.useMemo((): Role | undefined => {
        if (role) return role;
        if (!member || !roleMap.size || !serverRoles) return undefined;
        const memberRoleIds = [...member.roles];
        const everyoneRole = serverRoles.find(
            (r): boolean => r.name === '@everyone',
        );
        if (everyoneRole && !memberRoleIds.includes(everyoneRole.id)) {
            memberRoleIds.push(everyoneRole.id);
        }
        return getHighestColorRoleForMember(memberRoleIds, roleMap);
    }, [role, member, roleMap, serverRoles]);

    const resolvedIconRole = React.useMemo((): Role | undefined => {
        if (iconRole) return iconRole;
        if (!member || !roleMap.size || !serverRoles) return undefined;
        const memberRoleIds = [...member.roles];
        const everyoneRole = serverRoles.find(
            (r): boolean => r.name === '@everyone',
        );
        if (everyoneRole && !memberRoleIds.includes(everyoneRole.id)) {
            memberRoleIds.push(everyoneRole.id);
        }
        return getHighestRoleWithIconForMember(memberRoleIds, roleMap);
    }, [iconRole, member, roleMap, serverRoles]);

    const finalJoinedAt = joinedAt || member?.joinedAt;

    const user = adminData || fetchedUser || providedUser;

    // Presence data
    const presence = useAppSelector((state) => state.presence.users[userId]);
    const presenceStatus = presence?.status || 'offline';
    const presenceCustomText =
        presence?.customStatus?.text ??
        (user && 'customStatus' in user ? user.customStatus?.text : undefined);
    const presenceCustomEmoji =
        presence?.customStatus?.emoji ??
        (user && 'customStatus' in user ? user.customStatus?.emoji : undefined);

    const { data: currentUser } = useMe();
    const isOwner = serverDetails?.ownerId === currentUser?.id;
    const myMember = members?.find(
        (m): boolean => m.userId === currentUser?.id,
    );
    const myRoles = serverRoles?.filter(
        (r): boolean =>
            myMember?.roles.includes(r.id) || r.name === '@everyone',
    );
    const canManageRoles =
        isOwner ||
        (myRoles?.some(
            (r): boolean | undefined =>
                r.permissions?.administrator || r.permissions?.manageRoles,
        ) ??
            false);

    const myHighestRolePosition = React.useMemo((): number => {
        if (!myRoles || myRoles.length === 0) return -1;
        return Math.max(...myRoles.map((r): number => r.position));
    }, [myRoles]);

    const coords = useSmartPosition({
        isOpen: true,
        elementRef: popupRef,
        position,
        triggerRef,
    });

    // Close on click outside
    useEffect((): (() => void) => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return (): void => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on escape
    useEffect((): (() => void) => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return (): void => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!user && !userId) return null;

    return (
        <Box className="pointer-events-none fixed inset-0 z-[9999]">
            <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="pointer-events-auto"
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                ref={popupRef}
                style={{
                    position: 'absolute',
                    left: coords.x,
                    top: coords.y,
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                <UserProfileCard
                    adminData={adminData}
                    allServerRoles={serverRoles}
                    canManageRoles={canManageRoles}
                    className="custom-scrollbar max-h-[calc(100vh-32px)] overflow-x-hidden overflow-y-auto"
                    customStatus={{
                        text: presenceCustomText,
                        emoji: presenceCustomEmoji,
                    }}
                    disableColors={
                        disableColors ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    disableCustomFonts={
                        disableCustomFonts || serverDetails?.disableCustomFonts
                    }
                    disableGlow={
                        disableGlow ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    disableGlowAndColors={
                        disableGlowAndColors ||
                        serverDetails?.disableUsernameGlowAndCustomColor
                    }
                    iconRole={resolvedIconRole}
                    isOwner={isOwner}
                    joinedAt={finalJoinedAt}
                    myHighestRolePosition={myHighestRolePosition}
                    nickname={member?.nickname}
                    presenceStatus={presenceStatus}
                    role={resolvedRole}
                    roles={finalRoles}
                    serverId={serverId}
                    user={user as User}
                    userId={userId}
                />
            </motion.div>
        </Box>
    );
};
