import React, { useEffect, useRef } from 'react';
import { useMemo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useAppSelector } from '@/store/hooks';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserBadge } from '@/ui/components/common/UserBadge';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { resolveApiUrl } from '@/utils/apiUrl';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

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
    const userBio = user?.bio;
    const bioNodes = useMemo(
        () => (userBio ? parseText(userBio, ParserPresets.BIO) : []),
        [userBio]
    );

    const coords = useSmartPosition({
        isOpen,
        elementRef: popupRef,
        position,
        triggerRef,
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    if (!user && !userId) return null;

    const bannerColor = user?.usernameGradient?.colors?.[0] || '#5865F2';
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 pointer-events-none">
                    <motion.div
                        ref={popupRef}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            left: coords.x,
                            top: coords.y,
                        }}
                        className="pointer-events-auto w-[340px] max-h-[calc(100vh-32px)] bg-[var(--color-background)] rounded-2xl shadow-2xl flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar border border-[var(--color-border-subtle)]"
                    >
                        <div
                            className="h-[120px] sticky top-0 z-0 w-full overflow-hidden shrink-0"
                            style={{
                                backgroundColor: bannerColor,
                            }}
                        >
                            {user?.banner && user.banner.trim() !== '' && (
                                <img
                                    src={resolveApiUrl(user.banner) || ''}
                                    alt="User Banner"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        <div className="relative z-10 -mt-[50px] px-4">
                            <div className="p-1.5 bg-[var(--color-background)] rounded-full inline-block">
                                <UserProfilePicture
                                    src={user?.profilePicture}
                                    username={user?.username || ''}
                                    size="xl"
                                    status={presenceStatus}
                                    noIndicator={false}
                                />
                            </div>
                        </div>

                        <div className="p-4 pt-2">
                            <div className="mb-4">
                                <StyledUserName
                                    user={user}
                                    role={role}
                                    className="text-xl font-bold leading-tight w-full truncate"
                                >
                                    {user?.displayName || user?.username}
                                </StyledUserName>

                                <div className="text-sm text-[var(--color-muted-foreground)] font-medium select-text">
                                    @{user?.username}
                                    {user?.pronouns && (
                                        <span className="ml-2 text-[var(--color-muted-foreground/60)]">
                                            • {user.pronouns}
                                        </span>
                                    )}
                                </div>

                                {user?.badges && user.badges.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {user.badges.map((badge) => (
                                            <UserBadge
                                                key={badge._id}
                                                badge={badge}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(presenceCustomText || presenceCustomEmoji) &&
                                presenceStatus !== 'offline' && (
                                    <div className="mb-4 text-sm text-[var(--color-foreground/80)] flex items-center gap-2">
                                        {presenceCustomEmoji && (
                                            <span>{presenceCustomEmoji}</span>
                                        )}
                                        <span>{presenceCustomText}</span>
                                    </div>
                                )}

                            <div className="h-px bg-[var(--color-divider)] w-full my-3" />

                            {user?.bio && (
                                <div className="mb-4">
                                    <h3 className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2">
                                        About Me
                                    </h3>
                                    <div className="text-sm text-[var(--color-foreground/90)] whitespace-pre-wrap leading-relaxed">
                                        <ParsedText nodes={bioNodes} />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2">
                                        Member Since
                                    </h3>
                                    <div className="text-sm text-[var(--color-foreground/80)] flex items-center gap-2">
                                        <Calendar
                                            size={14}
                                            className="shrink-0"
                                        />
                                        <span className="truncate">
                                            {user?.createdAt &&
                                                new Date(
                                                    user.createdAt
                                                ).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                        </span>
                                    </div>
                                </div>

                                {joinedAt && (
                                    <div className="flex-1 min-w-0">
                                        <h3 className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2 truncate">
                                            Joined Server
                                        </h3>
                                        <div className="text-sm text-[var(--color-foreground/80)] flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="shrink-0"
                                            />
                                            <span className="truncate">
                                                {new Date(
                                                    joinedAt
                                                ).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {roles && roles.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="uppercase text-xs font-bold text-[var(--color-muted-foreground)] mb-2">
                                        Roles
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[...roles]
                                            .sort(
                                                (a, b) =>
                                                    b.position - a.position
                                            )
                                            .map((r) => (
                                                <div
                                                    key={r._id}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border-subtle)]"
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                r.color ||
                                                                '#B9BBBE',
                                                            backgroundImage:
                                                                r.colors &&
                                                                r.colors
                                                                    .length > 0
                                                                    ? `linear-gradient(90deg, ${r.colors.join(', ')})`
                                                                    : r.startColor &&
                                                                        r.endColor
                                                                      ? `linear-gradient(90deg, ${r.startColor}, ${r.endColor})`
                                                                      : undefined,
                                                        }}
                                                    />
                                                    <span className="text-xs font-medium text-[var(--color-foreground/90)]">
                                                        {r.name}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
