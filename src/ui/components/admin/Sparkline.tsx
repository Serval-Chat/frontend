import { type ReactNode } from 'react';

import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineProps {
    data: number[];
    className?: string;
}

interface TooltipPayloadEntry {
    value: number;
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: number;
}): ReactNode => {
    if (!active || !payload?.length) return null;
    const hour = label ?? 0;
    const hoursAgo = 23 - hour;
    const timeLabel =
        hoursAgo === 0
            ? 'Now'
            : hoursAgo === 1
              ? '1 hour ago'
              : `${hoursAgo} hours ago`;
    return (
        <div className="bg-bg-base rounded-lg border border-border-subtle px-3 py-1.5 text-xs shadow-lg">
            <p className="font-semibold text-foreground">
                {payload[0]?.value ?? 0}
            </p>
            <p className="text-muted-foreground">{timeLabel}</p>
        </div>
    );
};

export const Sparkline = ({ data, className }: SparklineProps): ReactNode => {
    const chartData = data.map((value, i) => ({ hour: i, value }));

    return (
        <div className={className} style={{ height: 52, width: '100%' }}>
            <ResponsiveContainer height="100%" width="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient
                            id="sparkGradient"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0.35}
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--color-primary)"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={false}
                        wrapperStyle={{ outline: 'none' }}
                    />
                    <Area
                        activeDot={{
                            r: 3,
                            fill: 'var(--color-primary)',
                            strokeWidth: 0,
                        }}
                        dataKey="value"
                        dot={false}
                        fill="url(#sparkGradient)"
                        isAnimationActive={false}
                        stroke="var(--color-primary)"
                        strokeWidth={1.5}
                        type="monotone"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
