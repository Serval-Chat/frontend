import type { ConCommandReactor } from '@/console/ConCommandRegistry';

const ESC = String.fromCharCode(27);
const RESET = `${ESC}[0m`;

const hueToRgb = (hue: number): [number, number, number] => {
    const h = ((hue % 360) + 360) % 360;
    const s = 1;
    const l = 0.5;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;
    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};

interface Swatch {
    code: number;
    label: string;
    contrastFg?: number;
}

const STANDARD_FG: Swatch[] = [
    { code: 30, label: 'Black' },
    { code: 31, label: 'Red' },
    { code: 32, label: 'Green' },
    { code: 33, label: 'Yellow' },
    { code: 34, label: 'Blue' },
    { code: 35, label: 'Magenta' },
    { code: 36, label: 'Cyan' },
    { code: 37, label: 'White' },
];

const BRIGHT_FG: Swatch[] = [
    { code: 90, label: 'Bl.Black' },
    { code: 91, label: 'Bl.Red' },
    { code: 92, label: 'Bl.Green' },
    { code: 93, label: 'Bl.Yellow' },
    { code: 94, label: 'Bl.Blue' },
    { code: 95, label: 'Bl.Magenta' },
    { code: 96, label: 'Bl.Cyan' },
    { code: 97, label: 'Bl.White' },
];

const STANDARD_BG: Swatch[] = [
    { code: 40, label: ' Black  ', contrastFg: 37 },
    { code: 41, label: ' Red    ', contrastFg: 37 },
    { code: 42, label: ' Green  ', contrastFg: 30 },
    { code: 43, label: ' Yellow ', contrastFg: 30 },
    { code: 44, label: ' Blue   ', contrastFg: 37 },
    { code: 45, label: ' Magenta', contrastFg: 37 },
    { code: 46, label: ' Cyan   ', contrastFg: 30 },
    { code: 47, label: ' White  ', contrastFg: 30 },
];

const BRIGHT_BG: Swatch[] = [
    { code: 100, label: ' Bl.Black  ', contrastFg: 37 },
    { code: 101, label: ' Bl.Red    ', contrastFg: 30 },
    { code: 102, label: ' Bl.Green  ', contrastFg: 30 },
    { code: 103, label: ' Bl.Yellow ', contrastFg: 30 },
    { code: 104, label: ' Bl.Blue   ', contrastFg: 30 },
    { code: 105, label: ' Bl.Magenta', contrastFg: 30 },
    { code: 106, label: ' Bl.Cyan   ', contrastFg: 30 },
    { code: 107, label: ' Bl.White  ', contrastFg: 30 },
];

const renderSwatch = (swatch: Swatch): string => {
    const codes = swatch.contrastFg
        ? `${swatch.contrastFg};${swatch.code}`
        : `${swatch.code}`;
    return `${ESC}[${codes}m${swatch.label}${RESET}`;
};

const SWATCHES_PER_ROW = 4;

const renderRows = (swatches: Swatch[]): string[] => {
    const rows: string[] = [];
    for (let i = 0; i < swatches.length; i += SWATCHES_PER_ROW) {
        rows.push(
            swatches
                .slice(i, i + SWATCHES_PER_ROW)
                .map(renderSwatch)
                .join(' '),
        );
    }
    return rows;
};

const GRADIENT_WIDTH = 48;

const renderGradientForeground = (): string => {
    let line = '';
    for (let i = 0; i < GRADIENT_WIDTH; i++) {
        const [r, g, b] = hueToRgb((i / GRADIENT_WIDTH) * 300);
        line += `${ESC}[38;2;${r};${g};${b}m█${RESET}`;
    }
    return line;
};

const renderGradientBackground = (): string => {
    let line = '';
    for (let i = 0; i < GRADIENT_WIDTH; i++) {
        const [r, g, b] = hueToRgb((i / GRADIENT_WIDTH) * 300);
        line += `${ESC}[48;2;${r};${g};${b}m ${RESET}`;
    }
    return line;
};

const heading = (text: string): string => `${ESC}[1;33m${text}${RESET}`;

export const ansitestCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'ansitest',
    execute: (): { output: string[] } => ({
        output: [
            '',
            `${ESC}[1;36mANSI Test${ESC}[0m`,
            `${ESC}[1;36m${'='.repeat(40)}${ESC}[0m`,
            '',
            heading('Standard foreground colors (30-37):'),
            ...renderRows(STANDARD_FG),
            '',
            heading('Bright foreground colors (90-97):'),
            ...renderRows(BRIGHT_FG),
            '',
            heading('Standard background colors (40-47):'),
            ...renderRows(STANDARD_BG),
            '',
            heading('Bright background colors (100-107):'),
            ...renderRows(BRIGHT_BG),
            '',
            heading('24-bit truecolor foreground gradient (38;2;r;g;b):'),
            renderGradientForeground(),
            '',
            heading('24-bit truecolor background gradient (48;2;r;g;b):'),
            renderGradientBackground(),
            '',
            heading('Inverse video (SGR 7 / 27):'),
            `${ESC}[7m This text is inverted ${ESC}[27m and this is normal again${RESET}`,
            '',
        ],
    }),
};
