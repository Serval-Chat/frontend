import React from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Link } from '@/ui/components/common/Link';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { PageWrapper } from '@/ui/components/layout/PageWrapper';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';

/**
 * @description 404 Not Found page
 */
export const NotFound: React.FC = () => (
    <Box className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-md">
        <DefaultBackground />

        <PageWrapper>
            <Heading className="text-4xl text-foreground/90" variant="page">
                404
            </Heading>
            <VerticalSpacer verticalSpace={16} />
            <Text as="p" className="font-medium">
                Page not found
            </Text>
            <Link className="mt-xl inline-block text-sm font-medium" to="/">
                Go back home
            </Link>
        </PageWrapper>
    </Box>
);
