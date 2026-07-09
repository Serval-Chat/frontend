import { Clock, VolumeX } from 'lucide-react';

import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const formatTimeout = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

type ComposerRestrictionNoticeProps =
    | { kind: 'timeout'; remainingTimeoutMs: number }
    | {
          kind: 'muted';
          muteReason: string | undefined | null;
          muteExpiryLabel: string;
      };

export const ComposerRestrictionNotice = (
    props: ComposerRestrictionNoticeProps,
): React.ReactNode => {
    if (props.kind === 'timeout') {
        return (
            <Box
                className={cn(
                    'relative mx-4 mb-4 flex h-[56px] items-center gap-3 overflow-visible rounded-lg border border-danger/30 bg-danger/5 px-4 transition-colors',
                )}
            >
                <Clock className="shrink-0 text-danger" size={20} />
                <div className="flex flex-1 items-center gap-2 overflow-hidden text-danger">
                    <Text
                        className="font-bold whitespace-nowrap"
                        variant="danger"
                    >
                        You've been timed out.
                    </Text>
                    <Text
                        className="text-sm whitespace-nowrap opacity-80"
                        variant="danger"
                    >
                        Remaining time:{' '}
                        {formatTimeout(props.remainingTimeoutMs)}
                    </Text>
                </div>
            </Box>
        );
    }

    return (
        <Box className="relative mx-4 mb-4 flex items-start gap-3 overflow-hidden rounded-lg border border-caution/30 bg-caution/10 px-4 py-3 text-black">
            <VolumeX className="mt-0.5 shrink-0" size={20} />
            <div className="min-w-0 flex-1">
                <Text as="div" className="font-bold text-black">
                    You are muted.
                </Text>
                <Text as="div" className="mt-1 truncate text-sm text-black/80">
                    {props.muteReason || 'No reason provided'}
                </Text>
                <Text
                    as="div"
                    className="mt-0.5 text-xs font-medium text-black/65"
                >
                    Until: {props.muteExpiryLabel}
                </Text>
            </div>
        </Box>
    );
};
