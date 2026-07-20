import React, { useRef, useState } from 'react';

import { useMe } from '@/api/users/users.queries';
import { useSelfStatus } from '@/hooks/useSelfStatus';
import { useAppSelector } from '@/store/hooks';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

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

    const backendInstanceId = useAppSelector(
        (state): string | null => state.presence.backendInstanceId,
    );
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
                        className="!text-header-primary text-sm leading-tight font-semibold"
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
                        className="text-header-secondary flex cursor-pointer items-center truncate text-xs leading-tight opacity-70 transition-opacity hover:opacity-100"
                        onClick={handleStatusClick}
                    >
                        {statusEmoji !== '' || statusText !== '' ? (
                            <>
                                <StatusEmoji statusEmoji={statusEmoji} />
                                <span className="truncate">{statusText}</span>
                            </>
                        ) : (
                            'Set specific status'
                        )}
                    </Box>
                    {backendInstanceId ? (
                        <Box
                            className="text-header-secondary mt-1 max-w-[150px] truncate text-[10px] opacity-40 hover:opacity-100"
                            title={`Backend Instance: ${backendInstanceId}`}
                        >
                            Instance: {backendInstanceId}
                        </Box>
                    ) : null}
                </Box>
            </Box>

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
