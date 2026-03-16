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
                'min-h-[36px] px-4 py-2 transition-all duration-300 ease-in-out',
                isTyping
                    ? 'bg-gradient-to-r from-primary/10 to-transparent opacity-100'
                    : 'bg-transparent opacity-0',
            )}
        >
            <Text
                className={cn(
                    'transition-opacity duration-300',
                    isTyping ? 'opacity-100' : 'opacity-0',
                )}
                color="muted"
                fontStyle="italic"
                size="sm"
            >
                {getTypingText()}
            </Text>
        </Box>
    );
};
