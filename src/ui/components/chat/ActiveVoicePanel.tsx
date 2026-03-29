import React from 'react';

import {
    HeadphoneOff,
    Headphones,
    Mic,
    MicOff,
    PhoneOff,
    Signal,
    SignalHigh,
    SignalLow,
    SignalMedium,
} from 'lucide-react';

import { useChannels, useServerDetails } from '@/api/servers/servers.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    leaveVoiceRoom,
    toggleDeafen,
    toggleMute,
} from '@/store/slices/voiceSlice';
import { IconButton } from '@/ui/components/common/IconButton';
import { cn } from '@/utils/cn';

export const ActiveVoicePanel: React.FC = () => {
    const {
        activeVoiceServerId,
        activeVoiceChannelId,
        isMuted,
        isDeafened,
        connectionQuality,
    } = useAppSelector((state) => state.voice);
    const dispatch = useAppDispatch();

    const { data: server } = useServerDetails(activeVoiceServerId);
    const { data: channels } = useChannels(activeVoiceServerId);

    if (!activeVoiceServerId || !activeVoiceChannelId) return null;

    const channel = channels?.find((c) => c._id === activeVoiceChannelId);

    const getSignalIcon = (): { icon: typeof Signal; color: string } => {
        switch (connectionQuality) {
            case 'excellent':
                return { icon: SignalHigh, color: 'text-success' };
            case 'good':
                return { icon: SignalMedium, color: 'text-warning' };
            case 'poor':
                return { icon: SignalLow, color: 'text-destructive' };
            case 'unknown':
            default:
                return { icon: Signal, color: 'text-muted-foreground' };
        }
    };

    const { icon: SignalIcon, color: signalColor } = getSignalIcon();

    return (
        <div className="flex flex-col border-b border-border-subtle bg-[var(--chat-bg)] px-2 py-2">
            <div className="flex items-center justify-between">
                <div className="flex flex-1 flex-col overflow-hidden px-1">
                    <div
                        className={cn('flex items-center gap-1.5', signalColor)}
                    >
                        <SignalIcon className="shrink-0" size={18} />
                        <span className="truncate text-sm leading-none font-bold">
                            Voice Connected
                        </span>
                    </div>
                    <span className="mt-1 cursor-pointer truncate text-xs font-semibold text-muted-foreground hover:underline">
                        {server?.name || ''} / {channel?.name || ''}
                    </span>
                </div>
                <div className="flex items-center gap-0.5 pl-2">
                    <IconButton
                        className={cn(
                            'hover:bg-white/10',
                            isMuted ? 'text-destructive' : 'text-white',
                        )}
                        icon={isMuted ? MicOff : Mic}
                        iconSize={18}
                        title={isMuted ? 'Unmute' : 'Mute'}
                        variant="ghost"
                        onClick={() => dispatch(toggleMute())}
                    />
                    <IconButton
                        className={cn(
                            'hover:bg-white/10',
                            isDeafened ? 'text-destructive' : 'text-white',
                        )}
                        icon={isDeafened ? HeadphoneOff : Headphones}
                        iconSize={18}
                        title={isDeafened ? 'Undeafen' : 'Deafen'}
                        variant="ghost"
                        onClick={() => dispatch(toggleDeafen())}
                    />
                    <IconButton
                        className="text-white hover:bg-white/10"
                        icon={PhoneOff}
                        iconSize={18}
                        title="Disconnect"
                        variant="ghost"
                        onClick={() => dispatch(leaveVoiceRoom())}
                    />
                </div>
            </div>
        </div>
    );
};
