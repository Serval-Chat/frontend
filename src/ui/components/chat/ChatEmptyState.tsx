import React from 'react';

import { NormalText } from '@/ui/components/common/NormalText';

/**
 * @description Empty state for when no conversation is selected.
 */
export const ChatEmptyState: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <NormalText className="text-foreground-muted">
                nothing here yet but us servals~!
            </NormalText>
        </div>
    );
};
