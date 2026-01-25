import emojiData from 'emoji-datasource-apple/emoji.json';

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

// Group emojis by category
export const groupedEmojis = (emojiData as EmojiData[]).reduce(
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

export const categories = Object.keys(groupedEmojis).sort((a, b) => {
    const order = [
        'Smileys & Emotion',
        'People & Body',
        'Animals & Nature',
        'Food & Drink',
        'Travel & Places',
        'Activities',
        'Objects',
        'Symbols',
        'Symbols',
        'Flags',
        'Component',
    ];
    return order.indexOf(a) - order.indexOf(b);
});

export const categoryIconMap: Record<string, EmojiData | undefined> = {
    'Smileys & Emotion': (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'grinning' || e.short_name === 'smiley'),
    ),
    'People & Body': (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'wave' || e.short_name === 'raised_hand'),
    ),
    'Animals & Nature': (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'bear' || e.short_name === 'dog'),
    ),
    'Food & Drink': (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'hamburger' || e.short_name === 'pizza'),
    ),
    'Travel & Places': (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'car' || e.short_name === 'rocket'),
    ),
    Activities: (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'soccer' || e.short_name === 'basketball'),
    ),
    Objects: (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'bulb' ||
                e.short_name === 'flashlight' ||
                e.short_name === 'computer'),
    ),
    Symbols: (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'heart' || e.short_name === 'purple_heart'),
    ),
    Flags: (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'white_flag' ||
                e.short_name === 'flag-white' ||
                e.short_name === 'triangular_flag_on_post'),
    ),
    Component: (emojiData as EmojiData[]).find(
        (e) =>
            e.has_img_apple &&
            (e.short_name === 'gear' ||
                e.short_name === 'wrench' ||
                e.short_name === 'tools'),
    ),
};

const TOTAL_COLS = 62;
const TOTAL_ROWS = 62;

export const getSpriteStyle = (emoji?: EmojiData): React.CSSProperties => {
    if (!emoji) return {};
    return {
        backgroundImage: 'url(/emoji-sheet.png)',
        backgroundPosition: `${(emoji.sheet_x / (TOTAL_COLS - 1)) * 100}% ${(emoji.sheet_y / (TOTAL_ROWS - 1)) * 100}%`,
        backgroundSize: `${TOTAL_COLS * 100}% ${TOTAL_ROWS * 100}%`,
        width: '100%',
        height: '100%',
        display: 'block',
    };
};

export const getUnicode = (emoji: EmojiData): string =>
    String.fromCodePoint(
        ...emoji.unified.split('-').map((u) => parseInt(u, 16)),
    );

// Map of unicode character to EmojiData
export const emojiMap = new Map<string, EmojiData>();
const emojiUnicodeList: string[] = [];

(emojiData as EmojiData[]).forEach((emoji) => {
    if (!emoji.has_img_apple) return;
    const unicode = getUnicode(emoji);
    emojiMap.set(unicode, emoji);
    emojiUnicodeList.push(unicode);
});

// Sort by length descending
emojiUnicodeList.sort((a, b) => b.length - a.length);

// Escape special regex characters
const escapeRegex = (string: string): string =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create a regex that matches any of the emojis
export const emojiRegex = new RegExp(
    `(${emojiUnicodeList.map(escapeRegex).join('|')})`,
);
