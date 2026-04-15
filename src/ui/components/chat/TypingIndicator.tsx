import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
    typingUsers: Array<{ userId: string; username: string }>;
    cooldown?: number;
    isSlowModeEnabled?: boolean;
    canBypassSlowMode?: boolean;
}

/**
 * @description Component to display typing indicators and slow mode cooldown
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingUsers: rawTypingUsers,
    cooldown = 0,
    isSlowModeEnabled = false,
    canBypassSlowMode = false,
}) => {
    const blocks = useAppSelector((state) => state.blocking.blocks);
    const typingUsers = rawTypingUsers.filter((u) => {
        const userBlocks = blocks[u.userId] || 0;
        return !(userBlocks & BlockFlags.HIDE_FROM_TYPING_INDICATORS);
    });

    const isTyping = typingUsers.length > 0;
    const hasCooldown = cooldown > 0;
    const showSlowModeInfo = isSlowModeEnabled || hasCooldown;

    const getTypingText = (): string => {
        if (!isTyping) {
            return '';
        } else if (typingUsers.length === 1) {
            return `${typingUsers[0].username} is typing...`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
        } else {
            return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    const getSlowModeText = (): string => {
        if (canBypassSlowMode) {
            return "Slowmode enabled. Huh? It doesn't affect YOU!";
        }
        return hasCooldown
            ? `Slowmode enabled. (${cooldown}s)`
            : 'Slowmode enabled.';
    };

    return (
        <Box
            className={cn(
                'pointer-events-none absolute right-0 bottom-0 left-0 z-10',
                'flex h-6 items-center justify-between px-4',
                'bg-gradient-to-t from-[var(--chat-bg)] via-[var(--chat-bg)]/80 to-transparent',
                isTyping || showSlowModeInfo ? 'opacity-100' : 'opacity-0',
                'transition-opacity duration-300 ease-in-out',
            )}
        >
            <Text color="muted" fontStyle="italic" size="xs">
                {getTypingText()}
            </Text>

            {showSlowModeInfo && (
                <Text className="font-medium text-primary" size="xs">
                    {getSlowModeText()}
                </Text>
            )}
        </Box>
    );
};
