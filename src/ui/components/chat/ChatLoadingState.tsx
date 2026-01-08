import React from 'react';

import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

/**
 * @description Loading state for the main chat area.
 */
export const ChatLoadingState: React.FC = () => {
    return (
        <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
};
