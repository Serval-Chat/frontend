export const DELETED_MESSAGE_RETENTION_OPTIONS = [
    5, 10, 20, 30, 60, 120, 360, 720, 1440, 4320,
] as const;
export const MIN_DELETED_MESSAGE_RETENTION_MINUTES = Math.min(
    ...DELETED_MESSAGE_RETENTION_OPTIONS,
);
export const MAX_DELETED_MESSAGE_RETENTION_MINUTES = Math.max(
    ...DELETED_MESSAGE_RETENTION_OPTIONS,
);
export const DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES =
    MAX_DELETED_MESSAGE_RETENTION_MINUTES;

export const sanitizeDeletedMessageRetentionMinutes = (
    value: unknown,
): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES;
    }

    return DELETED_MESSAGE_RETENTION_OPTIONS.reduce(
        (closest, option) =>
            Math.abs(option - value) < Math.abs(closest - value)
                ? option
                : closest,
        MIN_DELETED_MESSAGE_RETENTION_MINUTES,
    );
};

export const getDeletedMessageRetentionSliderIndex = (
    minutes: unknown,
): number =>
    DELETED_MESSAGE_RETENTION_OPTIONS.findIndex(
        (option) => option === sanitizeDeletedMessageRetentionMinutes(minutes),
    );

export const getDeletedMessageRetentionAtSliderIndex = (
    index: unknown,
): number => {
    if (typeof index !== 'number' || !Number.isFinite(index)) {
        return DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES;
    }

    const boundedIndex = Math.max(
        0,
        Math.min(
            DELETED_MESSAGE_RETENTION_OPTIONS.length - 1,
            Math.round(index),
        ),
    );
    return (
        DELETED_MESSAGE_RETENTION_OPTIONS[boundedIndex] ??
        DEFAULT_DELETED_MESSAGE_RETENTION_MINUTES
    );
};

export const isDeletedMessageWithinRetention = (
    deletedAt: unknown,
    retentionMinutes: unknown,
    now: number = Date.now(),
): boolean => {
    const deletedAtTime =
        deletedAt instanceof Date
            ? deletedAt.getTime()
            : typeof deletedAt === 'string'
              ? Date.parse(deletedAt)
              : Number.NaN;
    if (!Number.isFinite(deletedAtTime)) return false;

    const expiresAt =
        deletedAtTime +
        sanitizeDeletedMessageRetentionMinutes(retentionMinutes) * 60_000;
    return expiresAt > now;
};

export const formatDeletedMessageRetention = (minutes: number): string => {
    if (minutes % (24 * 60) === 0) {
        const days = minutes / (24 * 60);
        return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    if (minutes % 60 === 0) {
        const hours = minutes / 60;
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};
