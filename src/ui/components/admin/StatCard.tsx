import { type ReactNode } from 'react';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: number;
    icon: ReactNode;
}

export const StatCard = ({
    title,
    value,
    trend,
    icon,
}: StatCardProps): ReactNode => {
    const isPositive = trend !== undefined && trend > 0;
    const isNegative = trend !== undefined && trend < 0;

    return (
        <div className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl border border-border-subtle bg-bg-subtle p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
            {/* Background Accent */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-all duration-500 group-hover:bg-primary/10" />

            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Text as="p" size="sm" variant="muted" weight="medium">
                        {title}
                    </Text>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <Heading
                            className="text-3xl font-black tracking-tight"
                            level={3}
                        >
                            {value}
                        </Heading>
                        {trend !== undefined && (
                            <Text
                                as="span"
                                className={cn(
                                    'flex items-center text-xs leading-none',
                                    isPositive
                                        ? 'text-success'
                                        : isNegative
                                          ? 'text-danger'
                                          : 'text-muted-foreground',
                                )}
                                weight="bold"
                            >
                                {isPositive ? (
                                    <TrendingUp className="mr-0.5" size={12} />
                                ) : isNegative ? (
                                    <TrendingDown
                                        className="mr-0.5"
                                        size={12}
                                    />
                                ) : null}
                                {Math.abs(trend)}%
                            </Text>
                        )}
                    </div>
                </div>

                <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-foreground-inverse">
                    {icon}
                </div>
            </div>

            {/* Bottom Border */}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
        </div>
    );
};
