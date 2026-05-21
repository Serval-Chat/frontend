export interface TableColumn<T> {
    header: string;
    key: keyof T | ((item: T) => string);
    align?: 'left' | 'right';
}

function getVisualLength(str: string): number {
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /\u001b\[[0-9;]*m/g;
    return str.replace(ansiRegex, '').length;
}

function padString(
    str: string,
    width: number,
    align?: 'left' | 'right',
): string {
    const visualLen = getVisualLength(str);
    if (visualLen >= width) return str;
    const padding = ' '.repeat(width - visualLen);
    return align === 'right' ? padding + str : str + padding;
}

export function formatTable<T>(
    data: T[],
    columns: TableColumn<T>[],
    options?: {
        headerSeparatorChar?: string;
        padding?: number;
    },
): string[] {
    const separatorChar = options?.headerSeparatorChar ?? '-';
    const paddingVal = options?.padding ?? 2;
    const paddingStr = ' '.repeat(paddingVal);

    const colWidths = columns.map((col) => {
        const headerLen = getVisualLength(col.header);
        const maxValLen = data.reduce((max, item) => {
            const val =
                typeof col.key === 'function'
                    ? col.key(item)
                    : String(item[col.key] ?? '');
            return Math.max(max, getVisualLength(val));
        }, 0);
        return Math.max(headerLen, maxValLen);
    });

    const headerRow = columns
        .map((col, idx) => {
            const width = colWidths[idx];
            return padString(col.header, width, col.align);
        })
        .join(paddingStr);

    const totalWidth =
        colWidths.reduce((sum, w) => sum + w, 0) +
        (columns.length - 1) * paddingVal;
    const separatorLine = separatorChar.repeat(totalWidth);

    const dataRows = data.map((item) =>
        columns
            .map((col, idx) => {
                const width = colWidths[idx];
                const val =
                    typeof col.key === 'function'
                        ? col.key(item)
                        : String(item[col.key] ?? '');
                return padString(val, width, col.align);
            })
            .join(paddingStr),
    );

    return [headerRow, separatorLine, ...dataRows, separatorLine];
}
