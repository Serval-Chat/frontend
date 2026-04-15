import React, { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import {
    useMembers,
    useRoles,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
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

export const ProfilePopup: React.FC<ProfilePopupProps> = ({
    userId,
    isOpen,
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
}) => {
    const popupRef = useRef<HTMLDivElement>(null);

    const { data: fetchedUser } = useUserById(userId, {
        enabled: isOpen && !disableFetch && !adminView,
    });
    const { data: adminData } = useAdminUserDetail(
        adminView && isOpen ? userId : null,
    );
    const { data: members } = useMembers(serverId || null, {
        enabled: !!serverId && isOpen,
    });
    const { data: serverRoles } = useRoles(serverId || null, {
        enabled: !!serverId && isOpen,
    });
    const { data: serverDetails } = useServerDetails(serverId || null, {
        enabled: !!serverId && isOpen,
    });

    const member = React.useMemo(
        () => members?.find((m) => m.userId === userId),
        [members, userId],
    );

    const finalRoles = React.useMemo(() => {
        if (roles) return roles;
        if (!member || !serverRoles) return undefined;
        return serverRoles.filter((r) => member.roles.includes(r._id));
    }, [roles, member, serverRoles]);

    const roleMap = React.useMemo(() => {
        const map = new Map<string, Role>();
        serverRoles?.forEach((r) => map.set(r._id, r));
        return map;
    }, [serverRoles]);

    const resolvedRole = React.useMemo(() => {
        if (role) return role;
        if (!member || !roleMap.size) return undefined;
        return getHighestColorRoleForMember(member.roles, roleMap);
    }, [role, member, roleMap]);

    const resolvedIconRole = React.useMemo(() => {
        if (iconRole) return iconRole;
        if (!member || !roleMap.size) return undefined;
        return getHighestRoleWithIconForMember(member.roles, roleMap);
    }, [iconRole, member, roleMap]);

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

    const coords = useSmartPosition({
        isOpen,
        elementRef: popupRef,
        position,
        triggerRef,
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    if (!user && !userId) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
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
                                disableCustomFonts ||
                                serverDetails?.disableCustomFonts
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
                            joinedAt={finalJoinedAt}
                            presenceStatus={presenceStatus}
                            role={resolvedRole}
                            roles={finalRoles}
                            user={user as User}
                        />
                    </motion.div>
                </Box>
            )}
        </AnimatePresence>,
        document.body,
    );
};
