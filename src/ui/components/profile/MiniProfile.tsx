import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Check, Settings, X } from 'lucide-react';

import { useMe, useUpdateStatus } from '@/api/users/users.queries';
import { useWebSocket } from '@/hooks/ws/useWebSocket';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { SettingsModal } from '@/ui/components/settings/SettingsModal';

export const MiniProfile: React.FC = () => {
    const { data: user } = useMe();
    const { mutate: updateStatus, isPending } = useUpdateStatus();
    const queryClient = useQueryClient();
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
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
                void queryClient.invalidateQueries({ queryKey: ['me'] });
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

    const handleStatusClick = (): void => {
        setStatusText(customStatus?.text || '');
        setIsEditingStatus(true);
    };

    const handleSaveStatus = (): void => {
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

    const handleCancelStatus = (): void => {
        setIsEditingStatus(false);
        setStatusText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            handleSaveStatus();
        } else if (e.key === 'Escape') {
            handleCancelStatus();
        }
    };

    if (!user) return null;

    return (
        <Box className="flex items-center justify-between px-2 py-2 bg-[var(--tertiary-bg)] border-t border-[var(--color-border-subtle)] h-[60px] shrink-0">
            <Box className="flex items-center min-w-0 mr-2 flex-1">
                <Box className="relative shrink-0 mr-2">
                    <UserProfilePicture
                        className="w-9 h-9"
                        size="sm"
                        src={user.profilePicture}
                        status={presenceStatus}
                        username={user.username}
                    />
                </Box>
                <Box className="min-w-0 flex flex-col flex-1">
                    <Text className="text-sm font-semibold text-[var(--color-header-primary)] truncate leading-tight">
                        {user.displayName || user.username}
                    </Text>
                    {!isEditingStatus ? (
                        <Box
                            className="text-xs text-[var(--color-header-secondary)] truncate leading-tight opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={handleStatusClick}
                        >
                            {statusEmoji && (
                                <Text as="span" className="mr-1">
                                    {statusEmoji}
                                </Text>
                            )}
                            {displayStatus}
                        </Box>
                    ) : (
                        <Box className="flex items-center gap-1 mt-0.5">
                            <Input
                                className="h-6 text-xs px-1.5 py-0.5"
                                disabled={isPending}
                                maxLength={120}
                                placeholder="What's your status?"
                                ref={inputRef}
                                type="text"
                                value={statusText}
                                onChange={(e) => setStatusText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                className="h-6 w-6 p-0 min-h-0"
                                disabled={isPending}
                                title="Save"
                                variant="success"
                                onClick={handleSaveStatus}
                            >
                                <Check size={14} />
                            </Button>
                            <Button
                                className="h-6 w-6 p-0 min-h-0"
                                disabled={isPending}
                                title="Cancel"
                                variant="danger"
                                onClick={handleCancelStatus}
                            >
                                <X size={14} />
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>

            <Box className="flex items-center shrink-0">
                <IconButton
                    className="w-8 h-8 p-0"
                    icon={Settings}
                    iconSize={18}
                    onClick={() => setShowSettings(true)}
                />
            </Box>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </Box>
    );
};
