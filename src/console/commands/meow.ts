import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import katsRaw from '@/console/assets/kats.txt?raw';

const ESC = String.fromCharCode(27);
const RESET = `${ESC}[0m`;
const ART_COLOR = `${ESC}[1;37m`;

// kitties are split by trailer.
const KATS: string[] = katsRaw
    .split('[[trailer]]')
    .map((block): string => block.replace(/^\n+/, '').replace(/\n+$/, ''))
    .filter((block): boolean => block.trim().length > 0);

let deck: number[] = [];
let lastDrawn = -1;

const drawKat = (): string => {
    if (deck.length === 0) {
        deck = KATS.map((_kat, index): number => index);
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const held = deck[i] as number;
            deck[i] = deck[j] as number;
            deck[j] = held;
        }
        if (deck.length > 1 && deck[0] === lastDrawn) {
            const held = deck[0] as number;
            deck[0] = deck[1] as number;
            deck[1] = held;
        }
    }

    const index = deck.shift() as number;
    lastDrawn = index;
    return KATS[index] ?? '';
};

export const meowCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'meow',
    execute: (): { output: string[] } => {
        if (KATS.length === 0) {
            return { output: ['meow: no cats available'] };
        }

        return {
            output: [
                '',
                ...drawKat()
                    .split('\n')
                    .map((line): string => `${ART_COLOR}${line}${RESET}`),
                '',
            ],
        };
    },
};
