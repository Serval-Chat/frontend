import { useCallback, useEffect, useState } from 'react';

import { apiClient } from '@/api/client';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/components/common/Table';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface WcagIssue {
    ruleId: string;
    help: string;
    helpUrl: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
    target: string[];
    html: string;
    failureSummary?: string;
    route: string;
    theme: string;
    firstSeenAt: string;
    lastSeenAt: string;
    observations: number;
}

const IMPACT_VARIANTS = {
    critical: 'danger',
    serious: 'danger',
    moderate: 'caution',
    minor: 'success',
} as const;

const formatDate = (value: string): string => new Date(value).toLocaleString();

export const WcagIssues = (): React.ReactNode => {
    const [issues, setIssues] = useState<WcagIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async (): Promise<void> => {
        try {
            const response = await apiClient.get<WcagIssue[]>(
                '/api/v1/_internal/wcag/',
            );
            setIssues(response.data);
            setError(null);
        } catch {
            setError(
                'Could not load WCAG findings from the development server.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect((): (() => void) => {
        const initialLoad = window.setTimeout((): void => {
            void refresh();
        }, 0);
        const timer = window.setInterval((): void => {
            void refresh();
        }, 5000);
        return (): void => {
            window.clearTimeout(initialLoad);
            window.clearInterval(timer);
        };
    }, [refresh]);

    const clearIssues = async (): Promise<void> => {
        try {
            await apiClient.delete('/api/v1/_internal/wcag/');
            setIssues([]);
            setError(null);
        } catch {
            setError('Could not clear WCAG findings.');
        }
    };

    const observations = issues.reduce(
        (total, issue) => total + issue.observations,
        0,
    );
    const latestSeen = issues[0]?.lastSeenAt;

    return (
        <Box className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 overflow-y-auto p-6 lg:p-8">
            <Box className="flex flex-wrap items-start justify-between gap-4">
                <Box>
                    <Text
                        as="p"
                        className="mb-2"
                        size="xs"
                        tracking="wide"
                        transform="uppercase"
                        variant="primary"
                        weight="bold"
                    >
                        Development tools
                    </Text>
                    <Heading level={1} variant="page">
                        WCAG Reporter
                    </Heading>
                    <Text
                        as="p"
                        className="mt-2 max-w-2xl"
                        size="sm"
                        variant="muted"
                    >
                        Review accessibility findings collected across routes
                        and themes. Repeated findings are grouped and counted.
                    </Text>
                </Box>
                <Box className="flex gap-2">
                    <Button
                        disabled={loading}
                        size="sm"
                        variant="normal"
                        onClick={(): void => void refresh()}
                    >
                        Refresh
                    </Button>
                    <Button
                        disabled={issues.length === 0}
                        size="sm"
                        variant="danger"
                        onClick={(): void => void clearIssues()}
                    >
                        Clear findings
                    </Button>
                </Box>
            </Box>

            <Box className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                    { label: 'Unique findings', value: issues.length },
                    { label: 'Total observations', value: observations },
                    {
                        label: 'Most recently seen',
                        value: latestSeen ? formatDate(latestSeen) : '—',
                    },
                ].map((stat) => (
                    <Box
                        className="rounded-xl border border-border-subtle bg-bg-subtle p-4"
                        key={stat.label}
                    >
                        <Text as="p" size="xs" variant="muted" weight="medium">
                            {stat.label}
                        </Text>
                        <Text
                            as="p"
                            className="mt-2"
                            size={typeof stat.value === 'number' ? '2xl' : 'sm'}
                            weight="bold"
                        >
                            {stat.value}
                        </Text>
                    </Box>
                ))}
            </Box>

            {error && (
                <Box className="rounded-lg border border-danger/40 bg-danger/10 p-4">
                    <Text as="p" size="sm" variant="danger">
                        {error}
                    </Text>
                </Box>
            )}

            <Box className="min-h-0 flex-1">
                {loading && issues.length === 0 ? (
                    <Box className="flex h-48 items-center justify-center gap-3 rounded-xl border border-border-subtle bg-bg-subtle">
                        <LoadingSpinner />
                        <Text size="sm" variant="muted">
                            Loading findings…
                        </Text>
                    </Box>
                ) : issues.length === 0 ? (
                    <Box className="rounded-xl border border-dashed border-border-subtle bg-bg-subtle p-10 text-center">
                        <Heading level={2} variant="section">
                            No findings collected
                        </Heading>
                        <Text as="p" size="sm" variant="muted">
                            Keep the app open while the development profiler
                            scans it. Findings are collected after you sign in.
                        </Text>
                    </Box>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Impact</TableHead>
                                <TableHead>Finding</TableHead>
                                <TableHead>Context</TableHead>
                                <TableHead align="right">Seen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issues.map((issue) => (
                                <TableRow
                                    key={`${issue.ruleId}:${issue.route}:${issue.theme}:${issue.target.join('|')}`}
                                >
                                    <TableCell>
                                        <Text
                                            as="span"
                                            className="rounded-full border border-border-subtle px-2 py-1"
                                            size="xs"
                                            transform="capitalize"
                                            variant={
                                                IMPACT_VARIANTS[
                                                    issue.impact ?? 'minor'
                                                ]
                                            }
                                            weight="bold"
                                        >
                                            {issue.impact ?? 'unknown'}
                                        </Text>
                                    </TableCell>
                                    <TableCell className="min-w-64">
                                        <Text
                                            as="p"
                                            size="sm"
                                            weight="semibold"
                                        >
                                            {issue.help}
                                        </Text>
                                        <a
                                            className="mt-1 inline-block font-mono text-xs text-primary underline"
                                            href={issue.helpUrl}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            {issue.ruleId}
                                        </a>
                                        <details className="mt-2 max-w-xl">
                                            <summary className="cursor-pointer text-xs text-muted-foreground">
                                                Element details
                                            </summary>
                                            <Box className="mt-2 flex flex-col gap-2">
                                                <Text
                                                    as="p"
                                                    className="rounded bg-bg-secondary p-2 font-mono break-all"
                                                    size="xs"
                                                >
                                                    {issue.target.join(' → ')}
                                                </Text>
                                                <pre className="overflow-x-auto rounded bg-bg-secondary p-3 font-mono text-xs break-all whitespace-pre-wrap">
                                                    {issue.html}
                                                    {issue.failureSummary
                                                        ? `\n\n${issue.failureSummary}`
                                                        : ''}
                                                </pre>
                                            </Box>
                                        </details>
                                    </TableCell>
                                    <TableCell>
                                        <Text as="p" size="sm">
                                            {issue.route}
                                        </Text>
                                        <Text
                                            as="p"
                                            className="mt-1"
                                            size="xs"
                                            variant="muted"
                                        >
                                            Theme: {issue.theme}
                                        </Text>
                                        <Text
                                            as="p"
                                            className="mt-1"
                                            size="xs"
                                            variant="muted"
                                        >
                                            First seen{' '}
                                            {formatDate(issue.firstSeenAt)}
                                        </Text>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Text as="p" size="sm" weight="bold">
                                            {issue.observations}
                                        </Text>
                                        <Text
                                            as="p"
                                            className="mt-1 whitespace-nowrap"
                                            size="xs"
                                            variant="muted"
                                        >
                                            Last {formatDate(issue.lastSeenAt)}
                                        </Text>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>
            <Text as="p" size="xs" variant="muted">
                The profiler skips this page. Findings are stored in backend
                memory and clear when the development server restarts.
            </Text>
        </Box>
    );
};
