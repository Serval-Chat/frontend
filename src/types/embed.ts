export type ButtonStyle =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'link';
export type SelectType = 'string' | 'user' | 'role' | 'channel' | 'mentionable';
export type TextInputStyle = 'short' | 'paragraph';
export type EmbedType =
    | 'rich'
    | 'image'
    | 'video'
    | 'gifv'
    | 'article'
    | 'link';

export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}
export interface EmbedAuthor {
    name: string;
    url?: string;
    icon_url?: string;
}
export interface EmbedFooter {
    text: string;
    icon_url?: string;
}
export interface EmbedMedia {
    url: string;
    width?: number;
    height?: number;
}
export interface EmbedProvider {
    name?: string;
    url?: string;
}

export interface Embed {
    type?: EmbedType; // default: "rich"
    color?: number; // decimal int, e.g. 0x5865F2 = 5793266
    title?: string;
    url?: string; // makes title a link
    description?: string;
    timestamp?: string; // ISO 8601
    author?: EmbedAuthor;
    footer?: EmbedFooter;
    thumbnail?: EmbedMedia;
    image?: EmbedMedia;
    video?: EmbedMedia;
    provider?: EmbedProvider;
    fields?: EmbedField[]; // max 25
}

// --- Components ---

export interface Emoji {
    id?: string;
    name?: string;
    animated?: boolean;
}

export interface ButtonComponent {
    type: 'button';
    style: ButtonStyle;
    label?: string;
    emoji?: Emoji;
    custom_id?: string; // required for non-link buttons
    url?: string; // required for link buttons
    disabled?: boolean;
}

export interface SelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: Emoji;
    default?: boolean;
}

export interface SelectComponent {
    type: SelectType;
    custom_id: string;
    placeholder?: string;
    min_values?: number; // default 1
    max_values?: number; // default 1
    options?: SelectOption[]; // only for 'string' type
    disabled?: boolean;
}

export interface TextInputComponent {
    type: 'text_input';
    custom_id: string;
    style: TextInputStyle; // 'short' = single line, 'paragraph' = multiline
    label: string;
    min_length?: number;
    max_length?: number;
    required?: boolean;
    value?: string; // pre-filled value
    placeholder?: string;
}

export type Component = ButtonComponent | SelectComponent | TextInputComponent;

export interface ActionRow {
    type: 'action_row';
    components: Component[]; // max 5 buttons OR 1 select OR 1 text_input
}

// --- Poll ---

export interface PollAnswer {
    text: string;
    emoji?: Emoji;
}
export interface Poll {
    question: string;
    answers: PollAnswer[]; // up to 10
    duration: number; // hours
    allow_multiselect?: boolean;
}

// --- Top-level message ---

export interface AllowedMentions {
    parse?: ('users' | 'roles' | 'everyone')[];
    users?: string[]; // specific user IDs to allow
    roles?: string[]; // specific role IDs to allow
    replied_user?: boolean;
}

export interface MessagePayload {
    content?: string;
    embeds?: Embed[]; // max 10
    components?: ActionRow[]; // max 5
    allowed_mentions?: AllowedMentions;
    tts?: boolean;
    ephemeral?: boolean; // bot/interaction responses only
    suppress_embeds?: boolean;
    sticker_ids?: string[]; // max 3
    poll?: Poll;
    thread_name?: string; // creates a forum post
    nonce?: string | number; // dedup / optimistic UI
    enforce_nonce?: boolean;
}
