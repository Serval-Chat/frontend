import { type ReactNode } from 'react';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type { StatsRange } from '@/hooks/admin/useAdminStats';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface StatChartProps {
    title: string;
    data: number[];
    range: StatsRange;
    color?: string;
}

interface TooltipPayloadEntry {
    value: number;
}

interface StatTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: number;
    range: StatsRange;
    dataLength: number;
}

const StatTooltip = ({
    active,
    payload,
    label,
    range,
    dataLength,
}: StatTooltipProps): ReactNode => {
    if (!active || !payload?.length) return null;
    const idx = label ?? 0;
    let timeLabel: string;
    if (range === '24h') {
        const hoursAgo = 23 - idx;
        timeLabel =
            hoursAgo === 0
                ? 'Now'
                : hoursAgo === 1
                  ? '1 hour ago'
                  : `${hoursAgo}h ago`;
    } else {
        const total = range === 'all' ? dataLength : range === '7d' ? 7 : 30;
        const daysAgo = total - 1 - idx;
        timeLabel =
            daysAgo === 0
                ? 'Today'
                : daysAgo === 1
                  ? 'Yesterday'
                  : `${daysAgo} days ago`;
    }
    return (
        <div className="bg-bg-base rounded-lg border border-border-subtle px-3 py-1.5 text-xs shadow-lg">
            <p className="font-semibold text-foreground">
                {payload[0]?.value ?? 0}
            </p>
            <p className="text-muted-foreground">{timeLabel}</p>
        </div>
    );
};

StatTooltip.displayName = 'StatTooltip';

const makeXTickFormatter =
    (range: StatsRange, dataLength: number) =>
    (idx: number): string => {
        if (range === '24h') {
            const hoursAgo = 23 - idx;
            if (hoursAgo === 0) return 'Now';
            if (hoursAgo % 6 === 0) return `-${hoursAgo}h`;
            return '';
        }

        const total = range === 'all' ? dataLength : range === '7d' ? 7 : 30;
        const daysAgo = total - 1 - idx;

        if (daysAgo === 0) return 'Today';

        if (range === 'all') {
            let step = 30;
            if (total <= 14) step = 1;
            else if (total <= 60) step = 7;
            else if (total > 365) step = 90;
            if (daysAgo % step === 0) return `-${daysAgo}d`;
            return '';
        }

        const step = range === '7d' ? 1 : 5;
        if (daysAgo % step === 0) return `-${daysAgo}d`;
        return '';
    };

export const StatChart = ({
    title,
    data,
    range,
    color = 'var(--color-primary)',
}: StatChartProps): ReactNode => {
    const chartData = data.map((value, i) => ({ hour: i, value }));
    const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;
    const xTickFormatter = makeXTickFormatter(range, data.length);

    return (
        <Box
            className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-subtle"
            style={{ minHeight: 200, resize: 'vertical', overflow: 'auto' }}
        >
            {/* Header */}
            <Box className="flex items-center justify-between px-5 pt-4 pb-2">
                <Text size="sm" variant="muted" weight="medium">
                    {title}
                </Text>
            </Box>

            {/* Chart fills remaining height */}
            <Box className="min-h-0 flex-1 px-2 pb-3">
                <ResponsiveContainer height="100%" width="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 6, right: 12, left: -8, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id={gradId}
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={color}
                                    stopOpacity={0.25}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={color}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            stroke="var(--color-border-subtle)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            axisLine={false}
                            dataKey="hour"
                            height={22}
                            interval={0}
                            tick={{
                                fontSize: 11,
                                fill: 'var(--color-muted-foreground)',
                            }}
                            tickFormatter={xTickFormatter}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tick={{
                                fontSize: 11,
                                fill: 'var(--color-muted-foreground)',
                            }}
                            tickFormatter={(value) =>
                                value >= 1000
                                    ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
                                    : value
                            }
                            tickLine={false}
                            width={44}
                        />
                        <Tooltip
                            content={
                                <StatTooltip
                                    dataLength={data.length}
                                    range={range}
                                />
                            }
                            cursor={{
                                stroke: color,
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            }}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        <Area
                            isAnimationActive
                            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                            animationDuration={500}
                            dataKey="value"
                            dot={false}
                            fill={`url(#${gradId})`}
                            stroke={color}
                            strokeWidth={2}
                            type="linear"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

StatChart.displayName = 'StatChart';
