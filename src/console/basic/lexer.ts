import { BasicSyntaxError, type Token } from '@/console/basic/types';

const TWO_CHAR_OPS = ['<=', '>=', '<>'];
const ONE_CHAR_OPS = '+-*/^=<>(),;:'.split('');

const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';
const isAlpha = (ch: string): boolean =>
    (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
const isAlphaNumeric = (ch: string): boolean => isAlpha(ch) || isDigit(ch);

export function tokenize(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
        const ch = line[i] as string;

        if (ch === ' ' || ch === '\t') {
            i++;
            continue;
        }

        if (ch === "'") {
            break;
        }

        if (ch === '"') {
            let j = i + 1;
            let value = '';
            while (j < line.length && line[j] !== '"') {
                value += line[j];
                j++;
            }
            if (line[j] !== '"') {
                throw new BasicSyntaxError('Unterminated string');
            }
            tokens.push({ type: 'STRING', text: value });
            i = j + 1;
            continue;
        }

        if (isDigit(ch) || (ch === '.' && isDigit(line[i + 1] ?? ''))) {
            let j = i;
            let sawDot = false;
            while (
                j < line.length &&
                (isDigit(line[j] as string) ||
                    (line[j] === '.' && !sawDot && (sawDot = true)))
            ) {
                j++;
            }
            tokens.push({ type: 'NUMBER', text: line.slice(i, j) });
            i = j;
            continue;
        }

        if (isAlpha(ch)) {
            let j = i + 1;
            while (j < line.length && isAlphaNumeric(line[j] as string)) {
                j++;
            }
            if (line[j] === '$') {
                j++;
            }
            const word = line.slice(i, j).toUpperCase();
            tokens.push({ type: 'IDENT', text: word });
            i = j;
            if (word === 'REM') {
                break;
            }
            continue;
        }

        const twoChar = line.slice(i, i + 2);
        if (TWO_CHAR_OPS.includes(twoChar)) {
            tokens.push({ type: 'OP', text: twoChar });
            i += 2;
            continue;
        }

        if (ONE_CHAR_OPS.includes(ch)) {
            tokens.push({ type: 'OP', text: ch });
            i++;
            continue;
        }

        throw new BasicSyntaxError(`Unexpected character '${ch}'`);
    }

    tokens.push({ type: 'EOL', text: '' });
    return tokens;
}
