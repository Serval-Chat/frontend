import { type ReactNode } from 'react';

import { AlertTriangle, RefreshCcw, ShieldAlert, WifiOff } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface AdminErrorDisplayProps {
    error:
        | {
              response?: {
                  status?: number;
                  data?: {
                      message?: string;
                  };
              };
              message?: string;
              code?: string;
          }
        | null
        | undefined;
    reset?: () => void;
    className?: string;
    title?: string;
}

export const AdminErrorDisplay = ({
    error,
    reset,
    className,
    title,
}: AdminErrorDisplayProps): ReactNode => {
    const status = error?.response?.status;
    const message =
        error?.response?.data?.message ||
        error?.message ||
        'An unexpected error occurred.';

    let Icon = AlertTriangle;
    let errorTitle = title || 'Failed to Load Data';
    let description =
        'There was a problem retrieving the requested information.';
    let action =
        'Please try again later or contact a system administrator if the problem persists.';

    if (status === 403) {
        Icon = ShieldAlert;
        errorTitle = 'Security Clearance Required';
        description =
            'You do not have the necessary permissions to access this administrative resource.';
        action =
            'Ensure your account has been granted the required administrative roles.';
    } else if (status === 404) {
        errorTitle = 'Resource Not Found';
        description =
            'The requested information could not be located on the server.';
        action = 'Double-check the ID or search criteria and try again.';
    } else if (!navigator.onLine || error?.code === 'ERR_NETWORK') {
        Icon = WifiOff;
        errorTitle = 'Connection Interrupted';
        description =
            'Unable to establish a secure connection to the administrative API.';
        action = 'Check your network connection and try again.';
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500',
                className,
            )}
        >
            <div className="mb-6 rounded-2xl bg-danger/10 p-4 text-danger ring-1 ring-danger/20">
                <Icon size={48} strokeWidth={1.5} />
            </div>

            <Heading className="mb-2" level={3} variant="admin-section">
                {errorTitle}
            </Heading>

            <div className="max-w-md space-y-3">
                <Text as="p" variant="muted" weight="medium">
                    {description}
                </Text>
                <Text
                    as="p"
                    className="text-muted-foreground/60 italic"
                    size="sm"
                >
                    {action}
                </Text>

                <div className="mt-6 inline-block rounded-lg bg-bg-secondary/50 px-4 py-2 border border-border-subtle">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
                        Error Details:
                    </span>
                    <span className="font-mono text-xs text-danger">
                        {status ? `HTTP ${status}: ` : ''}
                        {message}
                    </span>
                </div>
            </div>

            {reset && (
                <Button
                    className="mt-8 px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                    variant="primary"
                    onClick={reset}
                >
                    <RefreshCcw size={16} />
                    Try Again
                </Button>
            )}
        </div>
    );
};
