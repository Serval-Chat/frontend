import React from 'react';

import { APP_LOCALE } from '@/utils/locale';
import type { TimestampFlag } from '@/utils/textParser/types';

interface TimestampProps {
    timestamp: number;
    flag?: TimestampFlag;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

type RelativeUnit = Intl.RelativeTimeFormatUnit;

const countFullYears = (from: Date, to: Date): number => {
    let years = to.getFullYear() - from.getFullYear();
    const anniversary = new Date(from);
    anniversary.setFullYear(from.getFullYear() + years);

    if (anniversary > to) years--;
    return years;
};

const countFullMonths = (from: Date, to: Date): number => {
    let months =
        (to.getFullYear() - from.getFullYear()) * 12 +
        to.getMonth() -
        from.getMonth();
    const anniversary = new Date(from);
    anniversary.setMonth(from.getMonth() + months);

    if (anniversary > to) months--;
    return months;
};

const getRelativeValue = (
    date: Date,
    now: number,
): { value: number; unit: RelativeUnit } => {
    const nowDate = new Date(now);
    const isFuture = date.getTime() > now;
    const earlier = isFuture ? nowDate : date;
    const later = isFuture ? date : nowDate;
    const sign = isFuture ? 1 : -1;
    const diffMs = later.getTime() - earlier.getTime();

    const years = countFullYears(earlier, later);
    if (years >= 1) return { value: sign * years, unit: 'year' };

    const months = countFullMonths(earlier, later);
    if (months >= 1) return { value: sign * months, unit: 'month' };

    const weeks = Math.floor(diffMs / MS_PER_WEEK);
    if (weeks >= 1) return { value: sign * weeks, unit: 'week' };

    const days = Math.floor(diffMs / MS_PER_DAY);
    if (days >= 1) return { value: sign * days, unit: 'day' };

    const hours = Math.floor(diffMs / MS_PER_HOUR);
    if (hours >= 1) return { value: sign * hours, unit: 'hour' };

    const minutes = Math.floor(diffMs / MS_PER_MINUTE);
    if (minutes >= 1) return { value: sign * minutes, unit: 'minute' };

    return {
        value: sign * Math.floor(diffMs / MS_PER_SECOND),
        unit: 'second',
    };
};

const formatRelativeTime = (date: Date, now: number): string => {
    const formatter = new Intl.RelativeTimeFormat(APP_LOCALE, {
        numeric: 'auto',
    });
    const { value, unit } = getRelativeValue(date, now);

    return formatter.format(value, unit);
};

const formatTimestamp = (
    date: Date,
    flag: TimestampFlag | undefined,
    now: number,
): string => {
    if (Number.isNaN(date.getTime())) return 'Invalid date';

    switch (flag) {
        case undefined:
        case 'f':
            return date.toLocaleString(APP_LOCALE, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        case 't':
            return date.toLocaleTimeString(APP_LOCALE, {
                hour: 'numeric',
                minute: '2-digit',
            });
        case 'T':
            return date.toLocaleTimeString(APP_LOCALE, {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
            });
        case 'd':
            return date.toLocaleDateString(APP_LOCALE, {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            });
        case 'D':
            return date.toLocaleDateString(APP_LOCALE, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        case 'F':
            return date.toLocaleString(APP_LOCALE, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        case 'R':
            return formatRelativeTime(date, now);
    }
};

export const Timestamp: React.FC<TimestampProps> = ({ timestamp, flag }) => {
    const [now, setNow] = React.useState(() => Date.now());
    const date = React.useMemo(() => new Date(timestamp * 1000), [timestamp]);
    const label = formatTimestamp(date, flag, now);
    const title = Number.isNaN(date.getTime())
        ? 'Invalid date'
        : date.toLocaleString(APP_LOCALE, {
              dateStyle: 'full',
              timeStyle: 'long',
          });

    React.useEffect(() => {
        if (flag !== 'R') return undefined;

        const interval = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(interval);
    }, [flag]);

    return (
        <time
            className="rounded bg-bg-secondary px-1 py-0.5 text-sm font-medium text-foreground"
            dateTime={
                Number.isNaN(date.getTime()) ? undefined : date.toISOString()
            }
            title={title}
        >
            {label}
        </time>
    );
};
