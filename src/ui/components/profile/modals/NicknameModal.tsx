import { useEffect, useRef, useState } from 'react';

import {
    useClearFriendNickname,
    useSetFriendNickname,
} from '@/api/friends/friends.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';

const NICKNAME_MAX_LENGTH = 32;

export interface NicknameModalProps {
    isOpen: boolean;
    onClose: () => void;
    friendId: string;
    friendUsername: string;
    currentNickname?: string | null;
}

export const NicknameModal = ({
    isOpen,
    onClose,
    friendId,
    friendUsername,
    currentNickname,
}: NicknameModalProps) => {
    const [nickname, setNickname] = useState(currentNickname ?? '');
    const { mutate: setFriendNickname, isPending: isSaving } =
        useSetFriendNickname();
    const { mutate: clearFriendNickname, isPending: isClearing } =
        useClearFriendNickname();
    const { showToast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect((): void => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const trimmed = nickname.trim();
    const hasExistingNickname =
        currentNickname !== undefined &&
        currentNickname !== null &&
        currentNickname !== '';

    const handleSave = (): void => {
        if (trimmed === '' || trimmed === (currentNickname ?? '')) return;

        setFriendNickname(
            { friendId, nickname: trimmed },
            {
                onSuccess: (): void => {
                    showToast('Nickname updated');
                    onClose();
                },
            },
        );
    };

    const handleClear = (): void => {
        clearFriendNickname(friendId, {
            onSuccess: (): void => {
                setNickname('');
                showToast('Nickname cleared');
                onClose();
            },
        });
    };

    return (
        <Modal
            className="max-w-md"
            isOpen={isOpen}
            title={hasExistingNickname ? 'Edit Nickname' : 'Add Friend Nickname'}
            onClose={onClose}
        >
            <Box className="flex flex-col gap-4">
                <Box className="flex flex-col gap-1.5">
                    <Input
                        maxLength={NICKNAME_MAX_LENGTH}
                        placeholder={`Enter a nickname for ${friendUsername}`}
                        ref={inputRef}
                        value={nickname}
                        onChange={(e): void => {
                            setNickname(e.target.value);
                        }}
                        onKeyDown={(e): void => {
                            if (e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                    <Box className="self-end text-xs text-muted-foreground">
                        {nickname.length}/{NICKNAME_MAX_LENGTH}
                    </Box>
                </Box>

                <Box className="flex items-center justify-between gap-3">
                    {hasExistingNickname ? (
                        <Button
                            className="text-muted-foreground hover:text-danger"
                            disabled={isClearing}
                            variant="ghost"
                            onClick={handleClear}
                        >
                            Clear Nickname
                        </Button>
                    ) : (
                        <Box />
                    )}
                    <Box className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                isSaving ||
                                trimmed === '' ||
                                trimmed === (currentNickname ?? '')
                            }
                            variant="primary"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};
