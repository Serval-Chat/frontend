import React from 'react';
import { Link } from 'react-router-dom';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { Heading } from '@/ui/components/Heading';
import { NormalText } from '@/ui/components/NormalText';
import { PageWrapper } from '@/ui/components/PageWrapper';
import { VerticalSpacer } from '@/ui/components/VerticalSpacer';

/**
 * @description 404 Not Found page
 */
const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            <PageWrapper>
                <Heading variant="page" className="text-4xl text-foreground/90">
                    404
                </Heading>
                <VerticalSpacer verticalSpace={16} />
                <NormalText className="font-medium">Page not found</NormalText>
                <Link
                    to="/"
                    className="inline-block mt-xl text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                    Go back home
                </Link>
            </PageWrapper>
        </div>
    );
};

export default NotFound;
