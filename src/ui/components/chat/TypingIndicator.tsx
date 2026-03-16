import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
    typingUsers: Array<{ userId: string; username: string }>;
}

/**
 * @description Component to display typing indicators
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingUsers,
}) => {
    const isTyping = typingUsers.length > 0;

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

    return (
        <Box
            className={cn(
                'pointer-events-none absolute right-0 bottom-0 left-0 z-10',
                'px-4 pt-6 pb-2 transition-opacity duration-300 ease-in-out',
                'bg-gradient-to-t from-[var(--chat-bg)] via-[var(--chat-bg)]/80 to-transparent',
                isTyping ? 'opacity-100' : 'opacity-0',
            )}
        >
            <Text color="muted" fontStyle="italic" size="sm">
                {getTypingText()}
            </Text>
        </Box>
    );
};
