import { useState } from 'react';

import { Ban, Hammer, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

import {
    useAdminBanUser,
    useAdminMuteUser,
    useAdminUnbanUser,
    useAdminUnmuteUser,
} from '@/hooks/admin/useAdminBans';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { useToast } from '@/ui/components/common/Toast';

interface PenaltyCardProps {
    userId: string;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const AdminMutePenaltyCard = ({
    userId,
    isCurrentlyMuted,
    muteUntilLabel,
    isOpen,
    onToggle,
    onClose,
}: PenaltyCardProps & {
    isCurrentlyMuted: boolean;
    muteUntilLabel: string;
}): React.ReactNode => {
    const { showToast } = useToast();
    const { mutate: muteUser, isPending: isMuting } = useAdminMuteUser();
    const { mutate: unmuteUser, isPending: isUnmuting } = useAdminUnmuteUser();
    const [muteReason, setMuteReason] = useState('');
    const [muteDuration, setMuteDuration] = useState('60'); // default 1 hour

    const handleMuteUser = (): void => {
        if (!muteReason.trim()) {
            showToast('Mute reason is required', 'error');
            return;
        }
        const durationMin = Number.parseInt(muteDuration, 10);
        if (isNaN(durationMin) || durationMin <= 0) {
            showToast('Duration must be a positive number', 'error');
            return;
        }
        muteUser(
            { userId, reason: muteReason, duration: durationMin },
            {
                onSuccess: (): void => {
                    onClose();
                    setMuteReason('');
                },
            },
        );
    };

    const handleUnmuteUser = (): void => {
        if (!globalThis.confirm('Are you sure you want to unmute this user?')) {
            return;
        }
        unmuteUser(userId);
    };

    return (
        <div className="rounded-xl border border-border-subtle bg-bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <VolumeX className="text-caution" size={18} />
                    <div>
                        <Text size="sm" weight="bold">
                            Mute Penalty
                        </Text>
                        {isCurrentlyMuted ? (
                            <Text className="block text-caution" size="xs">
                                Muted until {muteUntilLabel}
                            </Text>
                        ) : (
                            <Text className="block" size="xs" variant="muted">
                                No active mute
                            </Text>
                        )}
                    </div>
                </div>

                {isCurrentlyMuted ? (
                    <Button
                        disabled={isUnmuting}
                        size="sm"
                        variant="normal"
                        onClick={handleUnmuteUser}
                    >
                        <Volume2 className="mr-1.5" size={14} />
                        Unmute
                    </Button>
                ) : (
                    <Button size="sm" variant="caution" onClick={onToggle}>
                        <VolumeX className="mr-1.5" size={14} />
                        Mute User
                    </Button>
                )}
            </div>

            {isOpen && !isCurrentlyMuted ? (
                <div className="mt-4 space-y-3 border-t border-border-subtle/50 pt-4">
                    <InputWrapper>
                        <Text className="mb-1 block" size="xs" weight="bold">
                            Mute Duration (Minutes)
                        </Text>
                        <Input
                            placeholder="60 (1 hour)"
                            type="number"
                            value={muteDuration}
                            onChange={(e): void => {
                                setMuteDuration(e.target.value);
                            }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Text className="mb-1 block" size="xs" weight="bold">
                            Reason for Mute
                        </Text>
                        <TextArea
                            placeholder="Spamming, harassment, etc."
                            rows={2}
                            value={muteReason}
                            onChange={(e): void => {
                                setMuteReason(e.target.value);
                            }}
                        />
                    </InputWrapper>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isMuting}
                            size="sm"
                            variant="caution"
                            onClick={handleMuteUser}
                        >
                            {isMuting ? 'Muting...' : 'Confirm Mute'}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

const AdminBanPenaltyCard = ({
    userId,
    isCurrentlyBanned,
    banUntilLabel,
    isOpen,
    onToggle,
    onClose,
}: PenaltyCardProps & {
    isCurrentlyBanned: boolean;
    banUntilLabel: string;
}): React.ReactNode => {
    const { showToast } = useToast();
    const { mutate: banUser, isPending: isBanning } = useAdminBanUser();
    const { mutate: unbanUser, isPending: isUnbanning } = useAdminUnbanUser();
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState('1440'); // default 1 day

    const handleBanUser = (): void => {
        if (!banReason.trim()) {
            showToast('Ban reason is required', 'error');
            return;
        }
        const durationMin = Number.parseInt(banDuration, 10);
        if (isNaN(durationMin) || durationMin <= 0) {
            showToast('Duration must be a positive number', 'error');
            return;
        }
        banUser(
            { userId, reason: banReason, duration: durationMin },
            {
                onSuccess: (): void => {
                    onClose();
                    setBanReason('');
                },
            },
        );
    };

    const handleUnbanUser = (): void => {
        if (!globalThis.confirm('Are you sure you want to unban this user?')) {
            return;
        }
        unbanUser(userId);
    };

    return (
        <div className="rounded-xl border border-border-subtle bg-bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Ban className="text-danger" size={18} />
                    <div>
                        <Text size="sm" weight="bold">
                            Ban Penalty
                        </Text>
                        {isCurrentlyBanned ? (
                            <Text className="block text-danger" size="xs">
                                Banned until {banUntilLabel}
                            </Text>
                        ) : (
                            <Text className="block" size="xs" variant="muted">
                                No active ban
                            </Text>
                        )}
                    </div>
                </div>

                {isCurrentlyBanned ? (
                    <Button
                        disabled={isUnbanning}
                        size="sm"
                        variant="normal"
                        onClick={handleUnbanUser}
                    >
                        <ShieldAlert className="mr-1.5" size={14} />
                        Unban
                    </Button>
                ) : (
                    <Button size="sm" variant="danger" onClick={onToggle}>
                        <Hammer className="mr-1.5" size={14} />
                        Ban User
                    </Button>
                )}
            </div>

            {isOpen && !isCurrentlyBanned ? (
                <div className="mt-4 space-y-3 border-t border-border-subtle/50 pt-4">
                    <InputWrapper>
                        <Text className="mb-1 block" size="xs" weight="bold">
                            Ban Duration (Minutes)
                        </Text>
                        <Input
                            placeholder="1440 (1 day)"
                            type="number"
                            value={banDuration}
                            onChange={(e): void => {
                                setBanDuration(e.target.value);
                            }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Text className="mb-1 block" size="xs" weight="bold">
                            Reason for Ban
                        </Text>
                        <TextArea
                            placeholder="TOS violations, hate speech, etc."
                            rows={2}
                            value={banReason}
                            onChange={(e): void => {
                                setBanReason(e.target.value);
                            }}
                        />
                    </InputWrapper>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={isBanning}
                            size="sm"
                            variant="danger"
                            onClick={handleBanUser}
                        >
                            {isBanning ? 'Banning...' : 'Confirm Ban'}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

interface AdminModerationControlsProps {
    userId: string;
    isCurrentlyBanned: boolean;
    isCurrentlyMuted: boolean;
    banUntilLabel: string;
    muteUntilLabel: string;
}

export const AdminModerationControls = ({
    userId,
    isCurrentlyBanned,
    isCurrentlyMuted,
    banUntilLabel,
    muteUntilLabel,
}: AdminModerationControlsProps): React.ReactNode => {
    const [openForm, setOpenForm] = useState<'mute' | 'ban' | null>(null);

    return (
        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
            <Heading className="mb-4" level={3} variant="admin-sub">
                Moderation Controls
            </Heading>

            <div className="space-y-4">
                <AdminMutePenaltyCard
                    isCurrentlyMuted={isCurrentlyMuted}
                    isOpen={openForm === 'mute'}
                    muteUntilLabel={muteUntilLabel}
                    userId={userId}
                    onClose={(): void => {
                        setOpenForm(null);
                    }}
                    onToggle={(): void => {
                        setOpenForm(openForm === 'mute' ? null : 'mute');
                    }}
                />

                <AdminBanPenaltyCard
                    banUntilLabel={banUntilLabel}
                    isCurrentlyBanned={isCurrentlyBanned}
                    isOpen={openForm === 'ban'}
                    userId={userId}
                    onClose={(): void => {
                        setOpenForm(null);
                    }}
                    onToggle={(): void => {
                        setOpenForm(openForm === 'ban' ? null : 'ban');
                    }}
                />
            </div>
        </div>
    );
};
