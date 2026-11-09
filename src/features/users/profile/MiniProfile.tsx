import React, { useRef, useState } from 'react';

import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { ParsedEmoji } from '@/features/messages/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/features/messages/ParsedUnicodeEmoji';
import { StyledUserName } from '@/features/users/StyledUserName';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { Box } from '@/ui/primitives/Box';
import { IconButton } from '@/ui/primitives/IconButton';
import { Text } from '@/ui/primitives/Text';
import { Tooltip } from '@/ui/primitives/Tooltip';
import { isCustomEmojiId } from '@/utils/validation';

import { StatusModal } from './StatusModal';
import { StatusPicker } from './StatusPicker';

const StatusEmoji = ({
    statusEmoji,
}: {
    statusEmoji: string;
}): React.ReactNode => {
    if (statusEmoji === '') return null;

    const isCustomEmoji = isCustomEmojiId(statusEmoji);
    if (isCustomEmoji) {
        return (
            <ParsedEmoji
                nonInteractive
                className="mr-1 h-4 w-4"
                emojiId={statusEmoji}
            />
        );
    }

    return <ParsedUnicodeEmoji className="mr-1" content={statusEmoji} />;
};

export const MiniProfile = () => {
    const { data: user } = useMe();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
    const avatarRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();

    const { status: displayStatus, setStatus } = useSelfStatus();

    const customStatus = user?.customStatus;
    const statusText = customStatus?.text ?? '';
    const statusEmoji = customStatus?.emoji ?? '';

    const handleStatusClick = (): void => {
        setIsStatusModalOpen(true);
    };

    const handleAvatarClick = (): void => {
        setIsStatusPickerOpen((open) => !open);
    };

    if (!user) return null;

    return (
        <Box className="pride-glass flex min-h-[60px] shrink-0 items-center justify-between border-t border-border-subtle bg-[var(--tertiary-bg)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:h-[60px] md:py-2">
            <Box className="mr-2 flex min-w-0 flex-1 items-center">
                <Box ref={avatarRef}>
                    <UserProfilePicture
                        className="mr-2 shrink-0"
                        decorationId={user.decorationId}
                        size="sm"
                        src={user.profilePicture}
                        status={displayStatus}
                        username={user.username}
                        onClick={handleAvatarClick}
                    />
                </Box>
                <Box className="flex min-w-0 flex-1 flex-col">
                    <StyledUserName
                        className="text-sm leading-tight font-semibold !text-foreground"
                        disableColors={
                            user.settings?.disableCustomUsernameColors
                        }
                        disableCustomFonts={
                            user.settings?.disableCustomUsernameFonts
                        }
                        disableGlow={user.settings?.disableCustomUsernameGlow}
                        user={user}
                    >
                        {user.displayName ?? user.username}
                    </StyledUserName>
                    <Box
                        className="flex cursor-pointer items-center truncate text-xs leading-tight text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
                        onClick={handleStatusClick}
                    >
                        {statusEmoji !== '' || statusText !== '' ? (
                            <>
                                <StatusEmoji statusEmoji={statusEmoji} />
                                <Text className="truncate">{statusText}</Text>
                            </>
                        ) : (
                            'Set specific status'
                        )}
                    </Box>
                </Box>
            </Box>

            <Tooltip content="User Settings">
                <IconButton
                    aria-label="User Settings"
                    className="shrink-0 text-text-subtle hover:bg-white/10 hover:text-text-normal"
                    icon={Settings}
                    iconSize={21}
                    variant="ghost"
                    onClick={(): void => {
                        void navigate('/chat/@setting/my-account');
                    }}
                />
            </Tooltip>

            <StatusModal
                initialEmoji={statusEmoji}
                initialText={statusText}
                isOpen={isStatusModalOpen}
                onClose={(): void => {
                    setIsStatusModalOpen(false);
                }}
            />
            <StatusPicker
                currentStatus={displayStatus}
                isOpen={isStatusPickerOpen}
                triggerRef={avatarRef}
                onClose={(): void => {
                    setIsStatusPickerOpen(false);
                }}
                onSelect={setStatus}
            />
        </Box>
    );
};
