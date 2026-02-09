import { type ReactNode } from 'react';

import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

interface AdminLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
    title: string;
}

const AdminErrorFallback = ({
    error,
    resetErrorBoundary,
}: {
    error: Error;
    resetErrorBoundary: () => void;
}): ReactNode => (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-danger/20 bg-danger/5">
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-danger/10 text-danger">
            <AlertTriangle size={24} />
        </div>
        <Heading className="mb-2" level={3}>
            Something went wrong
        </Heading>
        <Text as="p" className="mb-6 max-w-md" size="sm" variant="muted">
            {error.message ||
                'An unexpected error occurred while rendering this section.'}
        </Text>
        <Button variant="primary" onClick={resetErrorBoundary}>
            Try Again
        </Button>
    </div>
);

export const AdminLayout = ({
    children,
    sidebar,
    title,
}: AdminLayoutProps): ReactNode => (
    <div className="flex min-h-screen bg-background text-foreground">
        {sidebar}

        <main className="ml-64 flex-1 overflow-auto">
            <header className="sticky top-0 z-sticky flex h-16 items-center border-b border-border-subtle bg-background/80 px-8 backdrop-blur-md">
                <Heading className="text-lg font-bold tracking-tight" level={1}>
                    {title}
                </Heading>
            </header>

            <div className="p-8">
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <AdminErrorFallback
                            error={error as Error}
                            resetErrorBoundary={resetErrorBoundary}
                        />
                    )}
                >
                    {children}
                </ErrorBoundary>
            </div>
        </main>
    </div>
);
