import { type ReactNode } from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { Stack } from '@/ui/components/layout/Stack';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
}

export const StatCard = ({ title, value, icon }: StatCardProps): ReactNode => (
    <Box className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl border border-border-subtle bg-bg-subtle p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        {/* Background Accent */}
        <Box className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-all duration-500 group-hover:bg-primary/10" />

        <Box className="flex items-start justify-between gap-4">
            <Stack gap="xs">
                <Text as="p" size="sm" variant="muted" weight="medium">
                    {title}
                </Text>
                <Heading
                    className="text-3xl font-black tracking-tight"
                    level={3}
                >
                    {value}
                </Heading>
            </Stack>

            <Box className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-foreground-inverse">
                {icon}
            </Box>
        </Box>
    </Box>
);
