import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Check, Settings, X } from 'lucide-react';

import { useMe, useUpdateStatus } from '@/api/users/users.queries';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import { useAppSelector } from '@/store/hooks';
import { IconButton } from '@/ui/components/common/IconButton';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';

export const MiniProfile: React.FC = () => {
    const { data: user } = useMe();
    const { mutate: updateStatus, isPending } = useUpdateStatus();
    const queryClient = useQueryClient();
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusText, setStatusText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<string | undefined>(user?.username);

    // Keep username ref in sync
    useEffect(() => {
        usernameRef.current = user?.username;
    }, [user?.username]);

    const presence = useAppSelector(
        (state) => state.presence.users[user?._id || '']
    );
    const presenceStatus = presence?.status || 'offline';

    const customStatus = user?.customStatus;
    const displayStatus = customStatus?.text || 'Set specific status';
    const statusEmoji = customStatus?.emoji;

    // Listen for status updates
    const handleStatusUpdate = useCallback(
        (payload: {
            username: string;
            status: {
                text: string;
                emoji?: string;
                expiresAt: string | null;
                updatedAt: string;
            } | null;
        }) => {
            // Only update if it's the current user's status
            if (
                usernameRef.current &&
                payload.username === usernameRef.current
            ) {
                queryClient.invalidateQueries({ queryKey: ['me'] });
            }
        },
        [queryClient]
    );

    useWebSocket('status_update', handleStatusUpdate);

    useEffect(() => {
        if (isEditingStatus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingStatus]);

    const handleStatusClick = () => {
        setStatusText(customStatus?.text || '');
        setIsEditingStatus(true);
    };

    const handleSaveStatus = () => {
        if (statusText.trim()) {
            updateStatus(
                {
                    text: statusText.trim(),
                    emoji: statusEmoji,
                },
                {
                    onSuccess: () => {
                        setIsEditingStatus(false);
                    },
                }
            );
        } else {
            updateStatus(
                { clear: true },
                {
                    onSuccess: () => {
                        setIsEditingStatus(false);
                    },
                }
            );
        }
    };

    const handleCancelStatus = () => {
        setIsEditingStatus(false);
        setStatusText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveStatus();
        } else if (e.key === 'Escape') {
            handleCancelStatus();
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center justify-between px-2 py-2 bg-[var(--tertiary-bg)] border-t border-[var(--color-border-subtle)] h-[60px] shrink-0">
            <div className="flex items-center min-w-0 mr-2 flex-1">
                <div className="relative shrink-0 mr-2">
                    <UserProfilePicture
                        src={user.profilePicture}
                        username={user.username}
                        status={presenceStatus}
                        size="sm"
                        className="w-9 h-9"
                    />
                </div>
                <div className="min-w-0 flex flex-col flex-1">
                    <div className="text-sm font-semibold text-[var(--color-header-primary)] truncate leading-tight">
                        {user.displayName || user.username}
                    </div>
                    {!isEditingStatus ? (
                        <div
                            className="text-xs text-[var(--color-header-secondary)] truncate leading-tight opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={handleStatusClick}
                        >
                            {statusEmoji && (
                                <span className="mr-1">{statusEmoji}</span>
                            )}
                            {displayStatus}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mt-0.5">
                            <input
                                ref={inputRef}
                                type="text"
                                value={statusText}
                                onChange={(e) => setStatusText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What's your status?"
                                disabled={isPending}
                                className="text-xs bg-[var(--color-bg-secondary)] text-[var(--color-foreground)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] focus:outline-none focus:border-primary flex-1 min-w-0"
                                maxLength={120}
                            />
                            <button
                                onClick={handleSaveStatus}
                                disabled={isPending}
                                className="text-success hover:text-success-hover transition-colors p-0.5"
                                title="Save"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={handleCancelStatus}
                                disabled={isPending}
                                className="text-danger hover:text-danger-hover transition-colors p-0.5"
                                title="Cancel"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center shrink-0">
                <IconButton
                    icon={Settings}
                    iconSize={18}
                    className="w-8 h-8 p-0"
                    onClick={() => {
                        /* TODO: Open settings */
                    }}
                />
            </div>
        </div>
    );
};
