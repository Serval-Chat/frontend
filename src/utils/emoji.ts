import emojiDataSlim from './emojiDataSlim.json';

export interface EmojiData {
    name: string;
    unified: string;
    non_qualified: string | null;
    docomo: string | null;
    au: string | null;
    softbank: string | null;
    google: string | null;
    image: string;
    sheet_x: number;
    sheet_y: number;
    short_name: string;
    short_names: string[];
    text: string | null;
    texts: string | null;
    category: string;
    subcategory: string;
    sort_order: number;
    added_in: string;
    has_img_apple: boolean;
    has_img_google: boolean;
    has_img_twitter: boolean;
    has_img_facebook: boolean;
}

export const getFullEmojiMetadata = (data: EmojiData[]) => {
    const grouped = data.reduce(
        (acc, emoji) => {
            if (!emoji.has_img_apple) return acc;
            if (!acc[emoji.category]) {
                acc[emoji.category] = [];
            }
            acc[emoji.category].push(emoji);
            return acc;
        },
        {} as Record<string, EmojiData[]>,
    );

    const cats = Object.keys(grouped).sort((a, b) => {
        const order = [
            'Smileys & Emotion',
            'People & Body',
            'Animals & Nature',
            'Food & Drink',
            'Travel & Places',
            'Activities',
            'Objects',
            'Symbols',
            'Flags',
            'Component',
        ];
        return order.indexOf(a) - order.indexOf(b);
    });

    const icons: Record<string, EmojiData | undefined> = {
        'Smileys & Emotion': data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'grinning' || e.short_name === 'smiley'),
        ),
        'People & Body': data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'wave' || e.short_name === 'raised_hand'),
        ),
        'Animals & Nature': data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'bear' || e.short_name === 'dog'),
        ),
        'Food & Drink': data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'hamburger' || e.short_name === 'pizza'),
        ),
        'Travel & Places': data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'car' || e.short_name === 'rocket'),
        ),
        Activities: data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'soccer' || e.short_name === 'basketball'),
        ),
        Objects: data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'bulb' ||
                    e.short_name === 'flashlight' ||
                    e.short_name === 'computer'),
        ),
        Symbols: data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'heart' || e.short_name === 'purple_heart'),
        ),
        Flags: data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'white_flag' ||
                    e.short_name === 'flag-white' ||
                    e.short_name === 'triangular_flag_on_post'),
        ),
        Component: data.find(
            (e) =>
                e.has_img_apple &&
                (e.short_name === 'gear' ||
                    e.short_name === 'wrench' ||
                    e.short_name === 'tools'),
        ),
    };

    return { grouped, cats, icons };
};

export const loadFullEmojiData = async (): Promise<EmojiData[]> => {
    const data = await import('emoji-datasource-apple/emoji.json');
    return data.default as EmojiData[];
};

export const getUnicode = (unified: string): string =>
    String.fromCodePoint(
        ...unified.split('-').map((u: string) => parseInt(u, 16)),
    );

export const getSpriteStyle = (emoji?: {
    x: number;
    y: number;
}): React.CSSProperties => {
    if (!emoji) return {};
    const TOTAL_COLS = 62;
    const TOTAL_ROWS = 62;
    return {
        backgroundImage: 'url(/emoji-sheet.png)',
        backgroundPosition: `${(emoji.x / (TOTAL_COLS - 1)) * 100}% ${(emoji.y / (TOTAL_ROWS - 1)) * 100}%`,
        backgroundSize: `${TOTAL_COLS * 100}% ${TOTAL_ROWS * 100}%`,
        width: '100%',
        height: '100%',
        display: 'block',
    };
};

export const emojiMap = new Map<string, { x: number; y: number; s: string }>();
const emojiUnicodeList: string[] = [];

emojiDataSlim.forEach((emoji) => {
    const unicode = getUnicode(emoji.u);
    emojiMap.set(unicode, { x: emoji.x, y: emoji.y, s: emoji.s });
    emojiUnicodeList.push(unicode);
});

emojiUnicodeList.sort((a, b) => b.length - a.length);

const escapeRegex = (string: string): string =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const emojiRegex = new RegExp(
    `(${emojiUnicodeList.map(escapeRegex).join('|')})`,
);
