import React from 'react';

import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

import {
    useAcknowledgeWarning,
    useMyWarnings,
} from '@/api/warnings/warnings.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { formatTimestamp } from '@/utils/timestamp';

export const StandingSettings: React.FC = () => {
    const { data: warnings, isLoading } = useMyWarnings();
    const { mutate: acknowledge, isPending } = useAcknowledgeWarning();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Text variant="muted">Loading standing information...</Text>
            </div>
        );
    }

    const hasWarnings = (warnings?.length || 0) > 0;

    return (
        <div className="max-w-3xl">
            <Heading className="mb-6" level={3}>
                Account Standing
            </Heading>

            {!hasWarnings ? (
                <div className="bg-success/10 border border-success/20 rounded-lg p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-success" size={32} />
                    </div>
                    <Heading level={4} variant="sub">
                        Your account is in good standing
                    </Heading>
                    <Text className="max-w-md" variant="muted">
                        Thank you for following the community guidelines! You
                        have no active warnings or restrictions on your account.
                    </Text>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-caution/10 border border-caution/20 rounded-lg p-4 flex gap-4 items-start">
                        <ShieldAlert
                            className="text-caution shrink-0"
                            size={24}
                        />
                        <div>
                            <Text weight="bold">Disciplinary History</Text>
                            <Text as="p" size="sm" variant="muted">
                                Below is a list of warnings issued to your
                                account. Some may require acknowledgment before
                                they can be dismissed.
                            </Text>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {warnings?.map((warning) => (
                            <div
                                className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-lg p-4"
                                key={warning._id}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle
                                            className="text-danger"
                                            size={18}
                                        />
                                        <Text size="sm" weight="bold">
                                            Warning from{' '}
                                            {warning.issuedBy.username}
                                        </Text>
                                    </div>
                                    <Text size="xs" variant="muted">
                                        {formatTimestamp(warning.timestamp)}
                                    </Text>
                                </div>
                                <div className="bg-[var(--color-background)] p-3 rounded border border-[var(--color-border-subtle)] mb-4">
                                    <Text size="sm">{warning.message}</Text>
                                </div>
                                <div className="flex justify-between items-center">
                                    {warning.acknowledged ? (
                                        <div className="flex items-center gap-1.5 text-success">
                                            <CheckCircle size={14} />
                                            <Text size="xs" weight="medium">
                                                Acknowledged on{' '}
                                                {warning.acknowledgedAt
                                                    ? formatTimestamp(
                                                          warning.acknowledgedAt,
                                                      )
                                                    : 'unknown'}
                                            </Text>
                                        </div>
                                    ) : (
                                        <>
                                            <Text
                                                className="text-danger"
                                                size="xs"
                                                weight="bold"
                                            >
                                                Acknowledgment Required
                                            </Text>
                                            <Button
                                                loading={isPending}
                                                size="sm"
                                                variant="danger"
                                                onClick={() =>
                                                    acknowledge(warning._id)
                                                }
                                            >
                                                Acknowledge
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-12 pt-6 border-t border-[var(--color-border-subtle)]">
                <Heading level={4} variant="sub">
                    Why do I see this?
                </Heading>
                <Text as="p" size="sm" variant="muted">
                    I maintain these records to help you know what you did
                    wrong. If you have questions about your warnings please
                    contact @cat on here. (Just send a friend request and I will
                    try to reply as fast as possible, if I don't reply within 24
                    hours please contact @catflare on Discord). The more
                    warnings you get, the more restrictions will be put on your
                    account, so beware!
                </Text>
            </div>
        </div>
    );
};
