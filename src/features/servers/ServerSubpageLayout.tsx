import type { ReactNode } from 'react';

import { Box } from '@/ui/primitives/Box';
import { cn } from '@/utils/cn';

interface ServerSubpageLayoutProps {
    children: ReactNode;
    footer?: ReactNode;
    reserveFooterSpace?: boolean;
}

export const ServerSubpageLayout = ({
    children,
    footer,
    reserveFooterSpace = false,
}: ServerSubpageLayoutProps) => (
    <Box className="chat-background relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Box
            className={cn(
                'custom-scrollbar flex-1 overflow-y-auto px-6 pt-4 md:px-10 md:pt-6',
                reserveFooterSpace ? 'pb-24' : 'pb-4',
            )}
        >
            {children}
        </Box>
        {footer}
    </Box>
);
