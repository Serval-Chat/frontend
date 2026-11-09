import React from 'react';

import { HelpCircle } from 'lucide-react';

import { Tooltip } from '@/ui/primitives/Tooltip';

export const PrivateFieldHint = ({
    visible,
    isOwnProfile,
    adminView,
}: {
    visible: boolean;
    isOwnProfile: boolean;
    adminView?: boolean;
}): React.ReactNode =>
    visible ? (
        <Tooltip
            content={
                isOwnProfile && !adminView
                    ? 'You made this field private'
                    : 'User made this field private to others'
            }
            position="top"
        >
            <HelpCircle
                className="ml-1 shrink-0 text-muted-foreground/60"
                size={12}
            />
        </Tooltip>
    ) : null;
