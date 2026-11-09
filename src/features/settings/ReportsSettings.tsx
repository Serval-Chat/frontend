import type { ReportStatus } from '@/api/reports/reports.api';
import { ReportIdCopy } from '@/features/moderation/ReportIdCopy';
import { useMyReports } from '@/features/moderation/hooks/useReports';
import { Heading } from '@/ui/primitives/Heading';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';
import { Text } from '@/ui/primitives/Text';

const STATUS_STYLES: Record<ReportStatus, string> = {
    open: 'border-primary/20 bg-primary-muted text-primary-muted-text',
    reviewing: 'border-border-subtle bg-bg-secondary text-muted-foreground',
    resolved: 'border-success/20 bg-success-muted text-success-muted-text',
    dismissed: 'border-danger/20 bg-danger-muted text-danger-muted-text',
};

export const ReportsSettings = () => {
    const { data: reports, isLoading, isError } = useMyReports();
    if (isLoading) return <LoadingSpinner />;
    if (isError)
        return (
            <Text as="p" size="sm" variant="danger">
                Could not load your reports.
            </Text>
        );
    return (
        <div className="flex flex-col gap-4">
            <div>
                <Heading className="mb-0" level={2} variant="sub">
                    My Reports
                </Heading>
                <Text as="p" size="sm" variant="muted">
                    Check the current status of reports you submitted.
                </Text>
            </div>
            {reports?.length ? (
                reports.map((report) => (
                    <div
                        className="rounded-lg border border-border-subtle p-4"
                        key={report.id}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Text weight="medium">
                                {report.targetType === 'message'
                                    ? 'Message report'
                                    : 'User report'}{' '}
                                ·{' '}
                                {[
                                    report.reasonLabel ??
                                        report.reason.replace(/_/g, ' '),
                                    report.subReasonLabel ??
                                        report.subReason?.replace(/_/g, ' '),
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </Text>
                            <Text
                                className={`rounded-full border px-2 py-1 text-xs capitalize ${STATUS_STYLES[report.status]}`}
                            >
                                {report.status}
                            </Text>
                        </div>
                        <Text as="p" className="mt-2" size="xs" variant="muted">
                            Submitted{' '}
                            {new Date(report.createdAt).toLocaleString()}
                        </Text>
                        <div className="mt-3">
                            <ReportIdCopy id={report.id} />
                        </div>
                    </div>
                ))
            ) : (
                <Text as="p" size="sm" variant="muted">
                    You have not submitted any reports.
                </Text>
            )}
        </div>
    );
};
