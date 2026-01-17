import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface TypingIndicatorProps {
    typingUsers: Array<{ userId: string; username: string }>;
}

/**
 * @description Component to display typing indicators
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingUsers,
}) => {
    if (typingUsers.length === 0) return null;

    const getTypingText = (): string => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].username} is typing...`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
        } else {
            return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    return (
        <Box className="px-4 py-2">
            <Text color="muted" fontStyle="italic" size="sm">
                {getTypingText()}
            </Text>
        </Box>
    );
};
