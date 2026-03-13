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
            <div className="flex h-full items-center justify-center">
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
                <div className="flex flex-col items-center rounded-lg border border-success/20 bg-success/10 p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
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
                    <div className="flex items-start gap-4 rounded-lg border border-caution/20 bg-caution/10 p-4">
                        <ShieldAlert
                            className="shrink-0 text-caution"
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
                                className="rounded-lg border border-border-subtle bg-bg-subtle p-4"
                                key={warning._id}
                            >
                                <div className="mb-2 flex items-start justify-between">
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
                                <div className="mb-4 rounded border border-border-subtle bg-background p-3">
                                    <Text size="sm">{warning.message}</Text>
                                </div>
                                <div className="flex items-center justify-between">
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

            <div className="mt-12 border-t border-border-subtle pt-6">
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
