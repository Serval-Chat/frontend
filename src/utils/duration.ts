export const formatMinutesDuration = (minutes: number): string => {
    if (minutes % 1440 === 0) {
        const days = minutes / 1440;
        return `${days} day${days === 1 ? '' : 's'}`;
    }
    if (minutes % 60 === 0) {
        const hours = minutes / 60;
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};
