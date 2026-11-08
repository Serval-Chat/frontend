import { Box } from '@/ui/primitives/Box';
import { Text } from '@/ui/primitives/Text';

/**
 * @description Empty state for when no conversation is selected.
 */
export const ChatEmptyState = () => (
    <Box className="flex flex-1 flex-col items-center justify-center">
        <Text className="text-foreground-muted">
            nothing here yet but us servals~!
        </Text>
    </Box>
);
