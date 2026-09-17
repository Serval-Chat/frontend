import type { ReactNode } from 'react';

import * as Sentry from '@sentry/react';
import { AlertTriangle } from 'lucide-react';
import {
    ErrorBoundary,
    type FallbackProps,
} from 'react-error-boundary';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

const RootErrorFallback = ({
    resetErrorBoundary,
}: FallbackProps): ReactNode => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-8 text-center text-foreground">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle size={28} />
        </div>
        <Heading className="mb-2" level={1}>
            Something went wrong
        </Heading>
        <Text as="p" className="mb-6 max-w-md" size="sm" variant="muted">
            An unexpected error occurred. The issue has been reported.
        </Text>
        <div className="flex gap-3">
            <Button variant="primary" onClick={resetErrorBoundary}>
                Try Again
            </Button>
            <Button
                variant="ghost"
                onClick={(): void => {
                    globalThis.location.reload();
                }}
            >
                Reload App
            </Button>
        </div>
    </div>
);

interface RootErrorBoundaryProps {
    children: ReactNode;
}

/**
 * @description Catches otherwise-uncaught render errors anywhere below it and
 * shows a full-page fallback instead of white-screening the app.
 */
export const RootErrorBoundary = ({
    children,
}: RootErrorBoundaryProps): ReactNode => (
    <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onError={(error, info): void => {
            Sentry.captureException(error, {
                extra: { componentStack: info.componentStack },
            });
        }}
    >
        {children}
    </ErrorBoundary>
);
