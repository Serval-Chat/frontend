const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;

    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < UNITS.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(1)} ${UNITS[unitIndex]}`;
}
