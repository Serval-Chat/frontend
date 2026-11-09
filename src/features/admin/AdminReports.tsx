import { useReducer, useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import type { ReportStatus } from '@/api/reports/reports.api';
import { ReportIdCopy } from '@/features/moderation/ReportIdCopy';
import {
    useAdminReports,
    useUpdateAdminReport,
} from '@/hooks/admin/useAdminReports';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { Input } from '@/ui/primitives/Input';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';
import { Select } from '@/ui/primitives/Select';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';
import { mergeReducer } from '@/utils/mergeReducer';

import { ReportMessagePreview } from './ReportMessagePreview';
import { ReportPunishmentActions } from './ReportPunishmentActions';
import { ReportUserProfileSnapshot } from './ReportUserProfileSnapshot';

const STATUSES: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];

interface ReportQuery {
    filter: ReportStatus | '';
    offset: number;
    reportIdInput: string;
    reportId: string;
}

export const AdminReports = () => {
    const location = useLocation();
    const [query, patchQuery] = useReducer(mergeReducer<ReportQuery>, {
        filter: 'open',
        offset: 0,
        reportIdInput: '',
        reportId: '',
    });
    const { filter, offset, reportIdInput, reportId } = query;
    const {
        data: reports,
        isLoading,
        isError,
    } = useAdminReports(
        reportId ? undefined : filter || undefined,
        reportId ? 0 : offset,
        reportId || undefined,
    );
    const profileIds = [
        ...new Set(
            (reports ?? []).flatMap((report) => [
                report.reporterId,
                ...(report.targetType === 'message' && report.targetUserId
                    ? [report.targetUserId]
                    : []),
            ]),
        ),
    ];
    const { data: profiles } = useUsers(profileIds);
    const profilesById = new Map(
        (profiles ?? []).map((user) => [user.id, user]),
    );
    const update = useUpdateAdminReport();
    const [drafts, setDrafts] = useState<
        Record<string, { status: ReportStatus; note: string }>
    >({});

    if (isLoading) return <LoadingSpinner />;
    if (isError)
        return (
            <Text as="p" size="sm" variant="danger">
                Could not load reports. Check the viewReports permission.
            </Text>
        );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Heading level={2}>User Reports</Heading>
                <div className="flex flex-wrap items-center gap-2">
                    <form
                        className="flex gap-2"
                        onSubmit={(event): void => {
                            event.preventDefault();
                            patchQuery({
                                reportId: reportIdInput.trim(),
                                offset: 0,
                            });
                        }}
                    >
                        <Input
                            aria-label="Search reports by ID"
                            minWidth="14rem"
                            placeholder="Search report ID"
                            size="md"
                            value={reportIdInput}
                            variant="secondary"
                            onChange={(event): void => {
                                patchQuery({
                                    reportIdInput: event.target.value,
                                });
                            }}
                        />
                        <Button type="submit" variant="normal">
                            Search
                        </Button>
                        {reportId ? (
                            <Button
                                variant="normal"
                                onClick={(): void => {
                                    patchQuery({
                                        reportId: '',
                                        reportIdInput: '',
                                        offset: 0,
                                    });
                                }}
                            >
                                Clear
                            </Button>
                        ) : null}
                    </form>
                    <Select
                        aria-label="Filter reports by status"
                        disabled={Boolean(reportId)}
                        size="md"
                        value={filter}
                        variant="secondary"
                        wrapperClassName="w-auto"
                        onChange={(event): void => {
                            patchQuery({
                                filter: event.target.value as ReportStatus | '',
                                offset: 0,
                            });
                        }}
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>
            {reportId ? (
                <Text as="p" size="xs" variant="muted">
                    Searching all statuses for report ID {reportId}.
                </Text>
            ) : null}
            {reports?.length ? (
                reports.map((report) => {
                    const targetProfile = report.targetUserId
                        ? profilesById.get(report.targetUserId)
                        : undefined;
                    const targetUser = targetProfile ?? {
                        id: report.targetUserId ?? 'unknown',
                        username: report.targetUsername ?? 'Unknown user',
                        displayName: report.targetUsername,
                        createdAt: new Date(report.createdAt),
                    };
                    const reporterProfile = profilesById.get(report.reporterId);
                    const draft = drafts[report.id] ?? {
                        status: report.status,
                        note: report.internalNote ?? '',
                    };
                    return (
                        <article
                            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-secondary p-4"
                            key={report.id}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <div className="font-semibold">
                                        {report.targetType} report ·{' '}
                                        {[
                                            report.reasonLabel ??
                                                report.reason.replace(
                                                    /_/g,
                                                    ' ',
                                                ),
                                            report.subReasonLabel ??
                                                report.subReason?.replace(
                                                    /_/g,
                                                    ' ',
                                                ),
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                    <Text as="p" size="xs" variant="muted">
                                        Reported user:{' '}
                                        {report.targetUserId ? (
                                            <Link
                                                className="text-primary hover:underline"
                                                state={{
                                                    from: `${location.pathname}${location.search}`,
                                                }}
                                                to={`/admin/users/${report.targetUserId}`}
                                            >
                                                Open current profile (reported
                                                as{' '}
                                                {report.targetUsername ??
                                                    report.targetUserId}
                                                )
                                            </Link>
                                        ) : (
                                            (report.targetUsername ??
                                                report.targetId) +
                                            ' (profile unavailable)'
                                        )}{' '}
                                        · Reporter:{' '}
                                        <Link
                                            className="text-primary hover:underline"
                                            state={{
                                                from: `${location.pathname}${location.search}`,
                                            }}
                                            to={`/admin/users/${report.reporterId}`}
                                        >
                                            View reporter profile:{' '}
                                            {report.reporterUsername ??
                                                reporterProfile?.displayName ??
                                                reporterProfile?.username ??
                                                report.reporterId}
                                        </Link>{' '}
                                        ·{' '}
                                        {new Date(
                                            report.createdAt,
                                        ).toLocaleString()}
                                    </Text>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ReportIdCopy id={report.id} />
                                    <Text
                                        className="rounded-full bg-bg-secondary px-2 py-1"
                                        size="xs"
                                    >
                                        {report.reportCount ?? 1}{' '}
                                        {(report.reportCount ?? 1) === 1
                                            ? 'report'
                                            : 'reports'}
                                    </Text>
                                    <Text
                                        className="rounded-full bg-bg-secondary px-2 py-1"
                                        size="xs"
                                        transform="capitalize"
                                    >
                                        {report.status}
                                    </Text>
                                </div>
                            </div>
                            {report.targetType === 'user' ? (
                                report.userProfileSnapshot ? (
                                    <div className="flex flex-col gap-2">
                                        <Text as="p" size="xs" weight="bold">
                                            Profile snapshot at submission
                                        </Text>
                                        <ReportUserProfileSnapshot
                                            reportId={report.id}
                                            snapshot={
                                                report.userProfileSnapshot
                                            }
                                            targetUserId={
                                                report.targetUserId ??
                                                report.targetId
                                            }
                                        />
                                    </div>
                                ) : (
                                    <Text as="p" size="xs" variant="muted">
                                        No profile snapshot is available for
                                        this older report.
                                    </Text>
                                )
                            ) : null}
                            <ReportMessagePreview
                                fallbackText={report.messageSnapshot}
                                report={report}
                                snapshot={report.messageContent}
                                user={targetUser}
                            />
                            {report.details ? (
                                <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
                                    <Text
                                        as="p"
                                        className="mb-1"
                                        size="xs"
                                        weight="bold"
                                    >
                                        Report details
                                    </Text>
                                    <Text as="p" size="sm">
                                        {report.details}
                                    </Text>
                                </div>
                            ) : null}
                            <ReportPunishmentActions
                                key={report.id}
                                report={report}
                            />
                            <div className="flex flex-wrap items-end gap-3">
                                <Text
                                    as="label"
                                    className="flex flex-col gap-1 text-xs"
                                >
                                    Status
                                    <Select
                                        size="md"
                                        value={draft.status}
                                        variant="admin"
                                        onChange={(event): void =>
                                            setDrafts((current) => ({
                                                ...current,
                                                [report.id]: {
                                                    ...draft,
                                                    status: event.target
                                                        .value as ReportStatus,
                                                },
                                            }))
                                        }
                                    >
                                        {STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Select>
                                </Text>
                                <Text
                                    as="label"
                                    className="flex min-w-64 flex-1 flex-col gap-1 text-xs"
                                >
                                    Internal note
                                    <TextArea
                                        autoResize={false}
                                        className="rounded-lg bg-background"
                                        maxLength={2000}
                                        textareaClassName="min-h-16 max-h-none resize-y p-2"
                                        value={draft.note}
                                        onChange={(event): void =>
                                            setDrafts((current) => ({
                                                ...current,
                                                [report.id]: {
                                                    ...draft,
                                                    note: event.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </Text>
                                <Button
                                    loading={update.isPending}
                                    variant="primary"
                                    onClick={(): void =>
                                        update.mutate({
                                            id: report.id,
                                            status: draft.status,
                                            internalNote: draft.note,
                                        })
                                    }
                                >
                                    Save
                                </Button>
                            </div>
                        </article>
                    );
                })
            ) : (
                <Text as="p" size="sm" variant="muted">
                    {reportId
                        ? 'No report matches this ID.'
                        : 'No reports match this filter.'}
                </Text>
            )}
            {!reportId && (reports?.length === 100 || offset > 0) ? (
                <div className="flex justify-end gap-2">
                    <Button
                        disabled={offset === 0}
                        variant="normal"
                        onClick={(): void => {
                            patchQuery((current) => ({
                                offset: Math.max(0, current.offset - 100),
                            }));
                        }}
                    >
                        Previous
                    </Button>
                    <Button
                        disabled={(reports?.length ?? 0) < 100}
                        variant="normal"
                        onClick={(): void => {
                            patchQuery((current) => ({
                                offset: current.offset + 100,
                            }));
                        }}
                    >
                        Next
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
