import React from 'react';

import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

/**
 * @description Empty state for when no conversation is selected.
 */
export const ChatEmptyState: React.FC = () => (
    <Box className="flex flex-1 flex-col items-center justify-center">
        <Text className="text-foreground-muted">
            nothing here yet but us servals~!
        </Text>
    </Box>
);
