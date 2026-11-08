import { Box } from '@/ui/primitives/Box';

import { ChatSkeleton } from './ChatSkeleton';

/**
 * @description Loading state for the main chat area.
 */
export const ChatLoadingState = () => (
    <Box className="flex flex-1 flex-col overflow-hidden">
        <ChatSkeleton />
    </Box>
);
