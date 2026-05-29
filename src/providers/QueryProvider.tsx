import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error): boolean => {
                const status = (error as { response?: { status?: number } })
                    .response?.status;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            retryDelay: (attemptIndex): number =>
                Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            gcTime: 30 * 60 * 1000,
            staleTime: 10 * 60 * 1000,
        },
        mutations: {
            retry: false,
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): ReactNode {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
