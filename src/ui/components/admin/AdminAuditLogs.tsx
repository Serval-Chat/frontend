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
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

import { AdminErrorDisplay } from './AdminErrorDisplay';

interface LogEntryProps {
    log: AuditLog;
}

const GRID_CLASS =
    'grid grid-cols-[160px_192px_1fr_192px_32px] gap-4 items-center px-6 py-4';
const HEADER_GRID_CLASS =
    'grid grid-cols-[160px_192px_1fr_192px_32px] gap-4 items-center px-6 py-3 border-b border-border-subtle bg-bg-secondary/50 text-xs font-black uppercase tracking-widest text-muted-foreground';

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
        <div
            className={cn(
                'group border-b border-border-subtle transition-colors duration-200',
                isExpanded ? 'bg-bg-secondary' : 'hover:bg-bg-subtle/50',
            )}
        >
            <div
                className={cn(
                    GRID_CLASS,
                    'cursor-pointer',
                    !hasData && 'cursor-default',
                )}
                role="button"
                tabIndex={0}
                onClick={() => hasData && setIsExpanded(!isExpanded)}
                onKeyDown={(e) => {
                    if (hasData && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                {/* Timestamp */}
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

                {/* Admin */}
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

                {/* Action */}
                <div className="flex items-center gap-2 overflow-hidden">
                    <div
                        className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap',
                            log.actionType.toLowerCase().includes('delete')
                                ? 'bg-danger/10 text-danger'
                                : log.actionType.toLowerCase().includes('ban')
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

                {/* Target */}
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

                {/* Expand Toggle */}
                <div className="flex justify-end text-muted-foreground">
                    {hasData &&
                        (isExpanded ? (
                            <ChevronUp size={18} />
                        ) : (
                            <ChevronDown size={18} />
                        ))}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && hasData && (
                <div className="animate-in fade-in slide-in-from-top-2 border-t border-border-subtle/50 px-6 py-4 duration-300">
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
                            {JSON.stringify(log.additionalData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
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
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-subtle">
                <div className={HEADER_GRID_CLASS}>
                    <div>Timestamp</div>
                    <div>Administrator</div>
                    <div>Action Performed</div>
                    <div>Target User</div>
                    <div className="ml-auto"></div>
                </div>

                <div className="divide-y divide-border-subtle">
                    {logs.length > 0 ? (
                        logs.map((log) => <LogEntry key={log._id} log={log} />)
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                            <Activity className="mb-4 opacity-20" size={48} />
                            <Text as="p" weight="medium">
                                No audit logs found
                            </Text>
                            <Text as="p" size="sm">
                                Administrative actions will appear here once
                                performed.
                            </Text>
                        </div>
                    )}
                </div>

                {/* Pagination Placeholder */}
                <div className="border-t border-border-subtle bg-bg-secondary/50 px-6 py-3 flex items-center justify-between">
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
            </div>
        </div>
    );
};
