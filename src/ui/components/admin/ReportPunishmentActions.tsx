import { useState } from 'react';

import { adminBansApi } from '@/api/admin/bans.api';
import type { StaffReport } from '@/api/reports/reports.api';
import { warningsApi } from '@/api/warnings/warnings.api';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { colors } from '@/ui/theme';
import { extractApiError } from '@/utils/extractApiError';

type Punishment = 'warn' | 'mute' | 'ban' | '';

interface ReportPunishmentActionsProps {
    report: StaffReport;
}

export const ReportPunishmentActions = ({
    report,
}: ReportPunishmentActionsProps) => {
    const userId = report.targetUserId;
    const reportReason = [
        report.reasonLabel ?? report.reason,
        report.subReasonLabel,
    ]
        .filter(Boolean)
        .join(' · ');
    const [punishment, setPunishment] = useState<Punishment>('');
    const [reason, setReason] = useState(`Reported for ${reportReason}`);
    const [duration, setDuration] = useState('60');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{
        message: string;
        isError: boolean;
    }>();

    if (!userId) return null;

    const submitPunishment = async (): Promise<void> => {
        if (!punishment) return;
        if (!reason.trim()) {
            setFeedback({
                message: 'A punishment reason is required.',
                isError: true,
            });
            return;
        }

        const durationMinutes = Number.parseInt(duration, 10);
        if (
            punishment !== 'warn' &&
            (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
        ) {
            setFeedback({
                message: 'Duration must be a positive number of minutes.',
                isError: true,
            });
            return;
        }
        if (
            punishment === 'warn' &&
            duration.trim() !== '' &&
            (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
        ) {
            setFeedback({
                message:
                    'Warning expiry must be a positive number of minutes or left blank.',
                isError: true,
            });
            return;
        }

        setIsSubmitting(true);
        setFeedback(undefined);
        const punishmentNotice = reason.trim();
        try {
            if (punishment === 'warn') {
                await warningsApi.warnUser(
                    userId,
                    punishmentNotice,
                    duration.trim() === '' ? undefined : durationMinutes,
                );
            } else if (punishment === 'mute') {
                await adminBansApi.muteUser(
                    userId,
                    punishmentNotice,
                    durationMinutes,
                );
            } else {
                await adminBansApi.banUser(
                    userId,
                    punishmentNotice,
                    durationMinutes,
                );
            }
            setFeedback({
                message: `${punishment === 'warn' ? 'Warning issued' : punishment === 'mute' ? 'User muted' : 'User banned'} successfully.`,
                isError: false,
            });
            setPunishment('');
        } catch (error) {
            setFeedback({
                message: extractApiError(error, 'Could not apply punishment.'),
                isError: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="rounded-xl border border-border-subtle bg-bg-subtle p-4">
            <div className="flex flex-col gap-4">
                <div>
                    <Text className="mb-2" size="sm" weight="bold">
                        Punishment
                    </Text>
                    <label className="flex max-w-xs flex-col gap-1 text-xs">
                        Action
                        <select
                            aria-label="Punishment for reported user"
                            className="w-full rounded-lg border border-border-subtle bg-background p-2 text-sm"
                            value={punishment}
                            onChange={(event): void => {
                                const next = event.target.value as Punishment;
                                setPunishment(next);
                                setDuration(
                                    next === 'ban'
                                        ? '1440'
                                        : next === 'mute'
                                          ? '60'
                                          : '',
                                );
                                setFeedback(undefined);
                            }}
                        >
                            <option value="">No punishment</option>
                            <option value="warn">Issue warning</option>
                            <option value="mute">Mute user</option>
                            <option value="ban">Ban user</option>
                        </select>
                    </label>
                </div>
                {punishment ? (
                    <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto]">
                        <div className="flex min-w-0 flex-col gap-1 text-xs">
                            <label
                                htmlFor={`report-punishment-reason-${report.id}`}
                            >
                                Reason
                            </label>
                            <Input
                                id={`report-punishment-reason-${report.id}`}
                                maxLength={500}
                                value={reason}
                                onChange={(event): void =>
                                    setReason(event.target.value)
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                            <label
                                htmlFor={`report-punishment-duration-${report.id}`}
                            >
                                {punishment === 'warn'
                                    ? 'Expiry (minutes)'
                                    : 'Duration (minutes)'}
                            </label>
                            <Input
                                id={`report-punishment-duration-${report.id}`}
                                min={punishment === 'warn' ? undefined : 1}
                                placeholder={
                                    punishment === 'warn'
                                        ? 'No expiry'
                                        : undefined
                                }
                                type="number"
                                value={duration}
                                onChange={(event): void =>
                                    setDuration(event.target.value)
                                }
                            />
                        </div>
                        <Button
                            fullWidth
                            disabled={isSubmitting}
                            size="md"
                            style={{
                                color:
                                    punishment === 'ban'
                                        ? undefined
                                        : colors.foreground,
                                height: '2.5rem',
                            }}
                            variant={
                                punishment === 'ban' ? 'danger' : 'caution'
                            }
                            onClick={(): void => {
                                void submitPunishment();
                            }}
                        >
                            {isSubmitting
                                ? 'Applying…'
                                : punishment === 'warn'
                                  ? 'Issue warning'
                                  : punishment === 'mute'
                                    ? 'Mute user'
                                    : 'Ban user'}
                        </Button>
                    </div>
                ) : null}
                {punishment === 'warn' ? (
                    <Text as="p" size="xs" variant="muted">
                        Warning expiry starts after acknowledgment. Leave blank
                        for no expiry.
                    </Text>
                ) : null}
            </div>
            {feedback ? (
                <Text
                    as="p"
                    className={`mt-2 ${feedback.isError ? 'text-danger' : 'text-success'}`}
                    role={feedback.isError ? 'alert' : 'status'}
                    size="xs"
                >
                    {feedback.message}
                </Text>
            ) : null}
        </section>
    );
};
