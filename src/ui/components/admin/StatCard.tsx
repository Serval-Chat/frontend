import { type ReactNode } from 'react';

import { ADMIN_UI_CONFIG } from '@/constants/admin';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';
import { cn } from '@/utils/cn';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
}

export const StatCard = ({ title, value, icon }: StatCardProps): ReactNode => (
    <Box className="group relative flex flex-col justify-center overflow-hidden rounded-xl border border-border-subtle bg-bg-subtle p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {/* Background Accent */}
        <Box className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-all duration-500 group-hover:bg-primary/10" />

        <Box className="flex items-start justify-between gap-4">
            <Stack gap="none">
                <Text
                    as="p"
                    className={cn(
                        ADMIN_UI_CONFIG.typography.metadata,
                        'tracking-tight uppercase',
                    )}
                    variant="muted"
                    weight="bold"
                >
                    {title}
                </Text>
                <Heading
                    className={cn(
                        ADMIN_UI_CONFIG.typography.metric,
                        'font-black tracking-tight',
                    )}
                    level={3}
                >
                    {value}
                </Heading>
            </Stack>

            <Box className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-foreground-inverse">
                {icon}
            </Box>
        </Box>
    </Box>
);
