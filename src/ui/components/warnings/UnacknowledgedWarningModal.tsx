import { useLayoutEffect } from 'react';

import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useMe } from '@/api/users/users.queries';
import {
    useAcknowledgeWarning,
    useMyWarnings,
} from '@/api/warnings/warnings.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { formatMinutesDuration } from '@/utils/duration';
import { formatTimestamp } from '@/utils/timestamp';

export const UnacknowledgedWarningModal = () => {
    const { data: me } = useMe();
    const { data: warnings, isLoading } = useMyWarnings(false);
    const { mutate: acknowledge, isPending } = useAcknowledgeWarning();

    const warning = warnings?.[0];
    const isBlocking = isLoading || warning !== undefined;

    useLayoutEffect((): (() => void) | undefined => {
        if (!isBlocking) return undefined;
        document.body.style.overflow = 'hidden';
        return (): void => {
            document.body.style.overflow = '';
        };
    }, [isBlocking]);

    if (typeof document === 'undefined' || !isBlocking) return null;

    if (isLoading || !warning) {
        return createPortal(
            <div aria-hidden className="fixed inset-0 z-top" />,
            document.body,
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-top flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                        <AlertTriangle size={28} />
                    </div>
                    <Heading level={1} variant="section">
                        Account Warning
                    </Heading>
                    <Text className="mt-1" size="sm" variant="muted">
                        Issued by {warning.issuedBy.username} &middot;{' '}
                        {formatTimestamp(
                            warning.timestamp,
                            me?.settings?.use24HourTime,
                        )}
                    </Text>
                </div>

                <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-5">
                    <Text size="sm">{warning.message}</Text>
                </div>

                <Text
                    as="p"
                    className="mt-4 text-center"
                    size="xs"
                    variant="muted"
                >
                    You must acknowledge this warning before you can send
                    messages, react, or make other changes to your account.
                    {warnings && warnings.length > 1
                        ? ` You have ${warnings.length} warnings to acknowledge.`
                        : ''}
                    {warning.expiryDurationMinutes
                        ? ` Once acknowledged, it will stay on your record for ${formatMinutesDuration(warning.expiryDurationMinutes)}.`
                        : ''}
                </Text>

                <Button
                    className="mt-6 w-full"
                    loading={isPending}
                    variant="danger"
                    onClick={(): void => {
                        acknowledge(warning.id);
                    }}
                >
                    I understand, acknowledge this warning
                </Button>
            </div>
        </div>,
        document.body,
    );
};
