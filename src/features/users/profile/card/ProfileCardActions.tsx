import React, { useRef, useState } from 'react';

import {
    Check,
    Copy,
    Flag,
    MessageSquare,
    Settings,
    UserMinus,
    UserPlus,
    X,
} from 'lucide-react';

import type { User } from '@/api/users/users.types';
import { ReportModal } from '@/features/moderation/ReportModal';
import { Popover } from '@/ui/primitives/Popover';
import { Pressable } from '@/ui/primitives/Pressable';
import { useToast } from '@/ui/primitives/Toast';
import { isWebhookUser } from '@/ui/utils/chat';

export type FriendRelationshipStatus =
    | 'friend'
    | 'incoming'
    | 'outgoing'
    | 'none';

export const ProfileCardActions = ({
    user,
    currentUserId,
    targetUserId,
    friendStatus,
    hideActions,
    onMessage,
    onAddFriend,
    onRemoveFriend,
    onAcceptFriend,
    onCancelFriendRequest,
}: {
    user?: User | Partial<User>;
    currentUserId?: string;
    targetUserId?: string;
    friendStatus: FriendRelationshipStatus;
    hideActions?: boolean;
    onMessage: () => void;
    onAddFriend: () => void;
    onRemoveFriend: () => void;
    onAcceptFriend: () => void;
    onCancelFriendRequest: () => void;
}): React.ReactNode => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { showToast } = useToast();

    if (
        hideActions ||
        !targetUserId ||
        currentUserId === targetUserId ||
        user?.isBot ||
        isWebhookUser(user)
    ) {
        return null;
    }

    const handleFriendAction = (): void => {
        setIsMenuOpen(false);
        if (friendStatus === 'friend') {
            onRemoveFriend();
        } else if (friendStatus === 'incoming') {
            onAcceptFriend();
        } else if (friendStatus === 'outgoing') {
            onCancelFriendRequest();
        } else {
            onAddFriend();
        }
    };

    const handleCopyUserId = async (): Promise<void> => {
        setIsMenuOpen(false);
        try {
            await navigator.clipboard.writeText(targetUserId);
            showToast('User ID copied to clipboard.', 'success');
        } catch {
            showToast('Could not copy user ID.', 'error');
        }
    };

    return (
        <>
            <div className="absolute top-3 right-3 z-30">
                <Pressable
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Profile actions"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    ref={triggerRef}
                    title="Profile actions"
                    onClick={(): void => setIsMenuOpen((open) => !open)}
                >
                    <Settings size={18} />
                </Pressable>
                <Popover
                    className="w-56 p-1"
                    isOpen={isMenuOpen}
                    triggerRef={triggerRef}
                    onClose={(): void => setIsMenuOpen(false)}
                >
                    <div role="menu">
                        <Pressable
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary focus-visible:outline-none"
                            role="menuitem"
                            onClick={handleFriendAction}
                        >
                            {friendStatus === 'friend' ? (
                                <UserMinus size={16} />
                            ) : friendStatus === 'outgoing' ? (
                                <X size={16} />
                            ) : friendStatus === 'incoming' ? (
                                <Check size={16} />
                            ) : (
                                <UserPlus size={16} />
                            )}
                            {friendStatus === 'friend'
                                ? 'Un-friend'
                                : friendStatus === 'outgoing'
                                  ? 'Cancel Friend Request'
                                  : friendStatus === 'incoming'
                                    ? 'Accept Friend Request'
                                    : 'Send a Friend Request'}
                        </Pressable>
                        <Pressable
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary focus-visible:outline-none"
                            role="menuitem"
                            onClick={(): void => {
                                setIsMenuOpen(false);
                                onMessage();
                            }}
                        >
                            <MessageSquare size={16} />
                            Message
                        </Pressable>
                        <Pressable
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary focus-visible:outline-none"
                            role="menuitem"
                            onClick={(): void => {
                                void handleCopyUserId();
                            }}
                        >
                            <Copy size={16} />
                            Copy User ID
                        </Pressable>
                        <div
                            aria-hidden
                            className="my-1 border-t border-border-subtle"
                        />
                        <Pressable
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-bg-secondary focus-visible:bg-bg-secondary focus-visible:outline-none"
                            role="menuitem"
                            onClick={(): void => {
                                setIsMenuOpen(false);
                                setIsReportModalOpen(true);
                            }}
                        >
                            <Flag size={16} />
                            Report User Profile
                        </Pressable>
                    </div>
                </Popover>
            </div>
            {isReportModalOpen ? (
                <ReportModal
                    isOpen
                    targetId={targetUserId}
                    targetType="user"
                    zIndex="var(--z-index-modal-top)"
                    onClose={(): void => setIsReportModalOpen(false)}
                />
            ) : null}
        </>
    );
};
