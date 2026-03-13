import React from 'react';

import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Box } from '@/ui/components/layout/Box';

/**
 * @description Loading state for the main chat area.
 */
export const ChatLoadingState: React.FC = () => (
    <Box className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
    </Box>
);
