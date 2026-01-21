import React, { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useAppSelector } from '@/store/hooks';
import { Box } from '@/ui/components/layout/Box';

import { UserProfileCard } from './UserProfileCard';

// We'll treat the popup as a fixed overlay that can be positioned
interface ProfilePopupProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    triggerRef?: React.RefObject<HTMLElement | null>;
    user?: User;
    role?: Role;
    roles?: Role[];
    joinedAt?: string;
    disableFetch?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
}

export const ProfilePopup: React.FC<ProfilePopupProps> = ({
    userId,
    isOpen,
    onClose,
    position,
    triggerRef,
    user: providedUser,
    role,
    roles,
    joinedAt,
    disableFetch,
    disableCustomFonts = false,
    disableGlow = false,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);

    const { data: fetchedUser } = useUserById(userId, {
        enabled: isOpen && !disableFetch,
    });
    const user = fetchedUser || providedUser;

    // Presence data
    const presence = useAppSelector((state) => state.presence.users[userId]);
    const presenceStatus = presence?.status || 'offline';
    const presenceCustomText =
        presence?.customStatus || user?.customStatus?.text;
    const presenceCustomEmoji = user?.customStatus?.emoji;

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
                <Box className="fixed inset-0 z-backdrop pointer-events-none">
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
                            className="max-h-[calc(100vh-32px)] overflow-y-auto overflow-x-hidden custom-scrollbar"
                            customStatus={{
                                text: presenceCustomText,
                                emoji: presenceCustomEmoji,
                            }}
                            disableCustomFonts={disableCustomFonts}
                            disableGlow={disableGlow}
                            joinedAt={joinedAt}
                            presenceStatus={presenceStatus}
                            role={role}
                            roles={roles}
                            user={user}
                        />
                    </motion.div>
                </Box>
            )}
        </AnimatePresence>,
        document.body,
    );
};
