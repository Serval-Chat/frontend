import React, { useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { IAuditLogChange } from '@/api/auditLog/auditLog.types';
import { resolveApiUrl } from '@/utils/apiUrl';

interface AuditLogDiffProps {
    changes: IAuditLogChange[];
}

function flattenChange(change: IAuditLogChange): Array<{
    field: string;
    before: string | React.ReactNode;
    after: string | React.ReactNode;
    isColor?: boolean;
}> {
    if (
        change.field === 'permissions' &&
        change.before !== null &&
        change.before !== undefined &&
        change.after !== null &&
        change.after !== undefined &&
        typeof change.before === 'object' &&
        typeof change.after === 'object'
    ) {
        const before = change.before as Record<string, boolean>;
        const after = change.after as Record<string, boolean>;
        const allKeys = Array.from(
            new Set([...Object.keys(before), ...Object.keys(after)]),
        );
        const rows = allKeys
            .filter((k) => before[k] !== after[k])
            .map((k) => ({
                field: k,
                before: formatBool(before[k]),
                after: formatBool(after[k]),
            }));
        if (rows.length === 0) return [];
        return rows;
    }

    const isColor =
        change.field === 'color' ||
        change.field === 'startColor' ||
        change.field === 'endColor' ||
        change.field === 'colors';

    return [
        {
            field: change.field,
            before: formatValue(change.before, change.field),
            after: formatValue(change.after, change.field),
            isColor,
        },
    ];
}

function formatBool(v: boolean | undefined): string {
    if (v === undefined) return 'None';
    return v ? 'Enabled' : 'Disabled';
}

function formatValue(value: unknown, field?: string): string | React.ReactNode {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    const isColorField =
        field &&
        (field === 'color' ||
            field === 'startColor' ||
            field === 'endColor' ||
            field === 'colors');

    if (isColorField) {
        if (Array.isArray(value)) {
            return (
                <div className="flex flex-wrap items-center gap-1.5">
                    {value.map((v, i) => (
                        <div
                            className="flex items-center gap-1.5"
                            // eslint-disable-next-line react/no-array-index-key
                            key={`color-${v}-${i}`}
                        >
                            <div
                                className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: String(v) }}
                            />
                            <span className="text-xs opacity-80">
                                {String(v)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5">
                <div
                    className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: String(value) }}
                />
                <span>{String(value)}</span>
            </div>
        );
    }

    if (
        typeof value === 'string' &&
        (value.startsWith('/api/v1/servers/banner/') ||
            value.startsWith('/api/v1/servers/icon/') ||
            value.startsWith('/api/v1/roles/icon/'))
    ) {
        return (
            <div className="bg-bg-base/50 mt-1 flex justify-center rounded p-1">
                <img
                    alt="Preview"
                    className="max-h-16 max-w-full rounded object-contain"
                    src={resolveApiUrl(value) ?? undefined}
                />
            </div>
        );
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        if (
            obj.type === 'image' &&
            typeof obj.value === 'string' &&
            obj.value.startsWith('/api/v1/')
        ) {
            return (
                <div className="bg-bg-base/50 mt-1 flex justify-center rounded p-1">
                    <img
                        alt="Preview"
                        className="max-h-16 max-w-full rounded object-contain"
                        src={resolveApiUrl(obj.value) ?? undefined}
                    />
                </div>
            );
        }
    }

    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'object') return JSON.stringify(value);

    return String(value);
}

export const AuditLogDiff: React.FC<AuditLogDiffProps> = ({ changes }) => {
    const [expanded, setExpanded] = useState(false);

    if (!changes || changes.length === 0) return null;

    const rows = changes.flatMap(flattenChange);
    if (rows.length === 0) return null;

    return (
        <div className="mt-2 text-sm">
            <button
                className="text-text-muted hover:text-text flex items-center gap-1 text-xs"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                {expanded
                    ? 'Hide Changes'
                    : `Show ${rows.length} Change${rows.length === 1 ? '' : 's'}`}
            </button>

            {expanded && (
                <div className="bg-bg-surface mt-2 rounded-md p-3">
                    {/* Header */}
                    <div className="text-text-muted mb-2 grid grid-cols-3 gap-2 border-b border-border-subtle pb-1 text-xs font-semibold">
                        <span>Field</span>
                        <span>Before</span>
                        <span>After</span>
                    </div>
                    <div className="space-y-4">
                        {rows.map((row, index) => (
                            <div
                                className="grid grid-cols-3 items-center gap-2 border-b border-border-subtle pb-3 last:border-0 last:pb-0"
                                // eslint-disable-next-line react/no-array-index-key
                                key={`row-${row.field}-${index}`}
                            >
                                <div className="text-text-muted font-medium break-all">
                                    {row.field}
                                </div>
                                <div
                                    className={`break-all ${row.isColor ? 'text-white' : 'text-red-400'}`}
                                >
                                    {row.before}
                                </div>
                                <div
                                    className={`break-all ${row.isColor ? 'text-white' : 'text-green-400'}`}
                                >
                                    {row.after}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
