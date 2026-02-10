import { type ReactNode, useState } from 'react';

import {
    Activity,
    ChevronDown,
    ChevronUp,
    Clock,
    Filter,
    Search,
    Terminal,
    User,
} from 'lucide-react';

import { ADMIN_CONSTANTS } from '@/constants/admin';
import { useAdminAuditLogs } from '@/hooks/admin/useAdminAuditLogs';
import { useAdminList } from '@/hooks/admin/useAdminList';
import type { AuditLog } from '@/types/admin';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
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
import { cn } from '@/utils/cn';

import { AdminErrorDisplay } from './AdminErrorDisplay';

interface LogEntryProps {
    log: AuditLog;
}

const LogEntry = ({ log }: LogEntryProps): ReactNode => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasData =
        log.additionalData && Object.keys(log.additionalData).length > 0;

    // Make it human readable
    const formatActionType = (type: string): string =>
        type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    const renderUser = (
        user: AuditLog['adminId'] | AuditLog['targetUserId'],
    ): string => {
        if (!user) return 'Unknown';
        if (typeof user === 'string') return user;
        return user.username || user._id || 'Unknown';
    };

    const date = new Date(log.timestamp);

    return (
        <>
            <TableRow
                className={cn(
                    'cursor-pointer',
                    !hasData && 'cursor-default',
                    isExpanded && 'bg-bg-secondary',
                )}
                onClick={() => hasData && setIsExpanded(!isExpanded)}
            >
                {/* Timestamp */}
                <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        <Text as="span" size="sm" variant="muted">
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </div>
                </TableCell>

                {/* Admin */}
                <TableCell>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User size={14} />
                        </div>
                        <Text
                            as="span"
                            className="truncate"
                            size="sm"
                            title={
                                typeof log.adminId === 'object'
                                    ? log.adminId._id
                                    : log.adminId
                            }
                            weight="medium"
                        >
                            {renderUser(log.adminId)}
                        </Text>
                    </div>
                </TableCell>

                {/* Action */}
                <TableCell>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div
                            className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
                                log.actionType.toLowerCase().includes('delete')
                                    ? 'bg-danger/10 text-danger'
                                    : log.actionType
                                            .toLowerCase()
                                            .includes('ban')
                                      ? 'bg-danger/10 text-danger'
                                      : log.actionType
                                              .toLowerCase()
                                              .includes('warn')
                                        ? 'bg-caution/10 text-caution'
                                        : 'bg-primary/10 text-primary',
                            )}
                        >
                            {formatActionType(log.actionType)}
                        </div>
                    </div>
                </TableCell>

                {/* Target */}
                <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                        {log.targetUserId ? (
                            <>
                                <Text
                                    as="span"
                                    className="text-[10px] uppercase opacity-50 shrink-0"
                                    weight="bold"
                                >
                                    Target:
                                </Text>
                                <Text
                                    as="span"
                                    className="truncate"
                                    size="sm"
                                    title={
                                        typeof log.targetUserId === 'object'
                                            ? log.targetUserId._id
                                            : log.targetUserId
                                    }
                                >
                                    {renderUser(log.targetUserId)}
                                </Text>
                            </>
                        ) : (
                            <Text
                                as="span"
                                className="text-[10px] uppercase opacity-20"
                                weight="bold"
                            >
                                No Target
                            </Text>
                        )}
                    </div>
                </TableCell>

                {/* Expand Toggle */}
                <TableCell align="right">
                    <div className="flex justify-end text-muted-foreground">
                        {hasData &&
                            (isExpanded ? (
                                <ChevronUp size={18} />
                            ) : (
                                <ChevronDown size={18} />
                            ))}
                    </div>
                </TableCell>
            </TableRow>

            {/* Expanded Content */}
            {isExpanded && hasData && (
                <TableRow className="bg-bg-secondary hover:bg-bg-secondary">
                    <TableCell colSpan={5}>
                        <div className="animate-in fade-in slide-in-from-top-2 px-6 py-4 duration-300">
                            <div className="rounded-xl border border-border-subtle bg-black/20 p-4 font-mono text-xs">
                                <div className="mb-2 flex items-center gap-2 text-primary">
                                    <Terminal size={12} />
                                    <Text
                                        as="span"
                                        className="uppercase tracking-widest"
                                        size="xs"
                                        weight="bold"
                                    >
                                        Metadata
                                    </Text>
                                </div>
                                <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground break-all">
                                    {JSON.stringify(
                                        log.additionalData,
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export const AdminAuditLogs = (): ReactNode => {
    const [filters, setFilters] = useState({
        limit: ADMIN_CONSTANTS.MAX_AUDIT_LOGS_PAGE_SIZE,
        offset: 0,
        adminId: '',
        targetUserId: '',
        actionType: '',
    });

    const { data: logs, isLoading, error } = useAdminAuditLogs(filters);
    const { data: admins } = useAdminList();

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !logs) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <AdminErrorDisplay
                    error={error}
                    title="Audit Logs Unavailable"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Toolbar */}
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border-subtle bg-bg-subtle p-5 lg:grid-cols-3">
                {/* Admin Select */}
                <div className="space-y-2">
                    <label
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        htmlFor="admin-select"
                    >
                        <User size={12} />
                        Administrator
                    </label>
                    <div className="relative">
                        <select
                            className="w-full appearance-none rounded-xl border border-border-subtle bg-background py-2.5 pl-4 pr-10 text-sm outline-none transition-focus focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                            id="admin-select"
                            value={filters.adminId}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    adminId: e.target.value,
                                }))
                            }
                        >
                            <option value="">All Administrators</option>
                            {admins?.map((admin) => (
                                <option key={admin._id} value={admin._id}>
                                    {admin.username}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                            size={14}
                        />
                    </div>
                </div>

                {/* Action Select */}
                <div className="space-y-2">
                    <label
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        htmlFor="action-select"
                    >
                        <Filter size={12} />
                        Action Type
                    </label>
                    <div className="relative">
                        <select
                            className="w-full appearance-none rounded-xl border border-border-subtle bg-background py-2.5 pl-4 pr-10 text-sm outline-none transition-focus focus:border-primary/50 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                            id="action-select"
                            value={filters.actionType}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    actionType: e.target.value,
                                }))
                            }
                        >
                            <option value="">All Actions</option>
                            <option value="ban_user">Ban User</option>
                            <option value="unban_user">Unban User</option>
                            <option value="warn_user">Warn User</option>
                            <option value="delete_message">
                                Delete Message
                            </option>
                            <option value="update_user">Update User</option>
                            <option value="delete_server">Delete Server</option>
                        </select>
                        <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                            size={14}
                        />
                    </div>
                </div>

                {/* Target ID Input */}
                <div className="space-y-2">
                    <label
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        htmlFor="target-user-input"
                    >
                        <Search size={12} />
                        Target User ID
                    </label>
                    <Input
                        id="target-user-input"
                        placeholder="Paste User ID here..."
                        type="text"
                        value={filters.targetUserId}
                        variant="admin"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFilters((prev) => ({
                                ...prev,
                                targetUserId: e.target.value,
                            }))
                        }
                    />
                </div>
            </div>

            {/* Logs Table */}
            <Table>
                <TableHeader>
                    <TableRow className="bg-bg-secondary/50 border-b border-border-subtle">
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Administrator</TableHead>
                        <TableHead>Action Performed</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead align="right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? (
                        logs.map((log) => <LogEntry key={log._id} log={log} />)
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground text-center">
                                    <Activity
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        No audit logs found
                                    </Text>
                                    <Text as="p" size="sm">
                                        Administrative actions will appear here
                                        once performed.
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination Placeholder */}
            {logs.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-subtle px-6 py-4">
                    <Text as="span" size="xs" variant="muted">
                        Showing latest {logs.length} entries
                    </Text>
                    <div className="flex gap-2">
                        <Button
                            disabled={filters.offset === 0}
                            size="sm"
                            variant="normal"
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    offset: Math.max(
                                        0,
                                        (prev.offset || 0) -
                                            (prev.limit ||
                                                ADMIN_CONSTANTS.MAX_AUDIT_LOGS_PAGE_SIZE),
                                    ),
                                }))
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={
                                logs.length <
                                (filters.limit ||
                                    ADMIN_CONSTANTS.MAX_AUDIT_LOGS_PAGE_SIZE)
                            }
                            size="sm"
                            variant="normal"
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    offset:
                                        (prev.offset || 0) +
                                        (prev.limit ||
                                            ADMIN_CONSTANTS.MAX_AUDIT_LOGS_PAGE_SIZE),
                                }))
                            }
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
