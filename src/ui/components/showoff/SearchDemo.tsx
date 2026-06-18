import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { Hash, MessageCircle, Search, X } from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { colors, fontWeight, radius, shadow } from '@/ui/theme';

import { DemoSection } from './DemoSection';

interface MockMessage {
    id: string;
    senderName: string;
    senderAvatar: string;
    sentAt: string;
    text: string;
}

const CHANNEL_MESSAGES: MockMessage[] = [
    {
        id: 'c1',
        senderName: 'stevecomputer',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-1.jpg',
        sentAt: 'Yesterday at 10:05 PM',
        text: 'i just went swimming and did the worst dive in history. hit the water with such force that i feel like i got shot in the chest',
    },
    {
        id: 'c2',
        senderName: 'stevecomputer',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-1.jpg',
        sentAt: 'Yesterday at 10:06 PM',
        text: "man i'm in pain right now",
    },
    {
        id: 'c3',
        senderName: 'Microsoft® sponsored NT™ fanboy',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-4.jpg',
        sentAt: 'Yesterday at 10:10 PM',
        text: "those who react with a laugh emoji, I'd like to hear your counter argument lol",
    },
    {
        id: 'c4',
        senderName: 'stevecomputer',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-1.jpg',
        sentAt: 'Yesterday at 10:11 PM',
        text: "I accidentally reacted. I'm on my phone. Sorry",
    },
    {
        id: 'c5',
        senderName: 'Evalyn the Dragon Girl',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-5.jpg',
        sentAt: 'Yesterday at 10:16 PM',
        text: "This only happens when people don't act civil. A 😆 emoji with no context isn't exactly the most civil thing to do imho",
    },
    {
        id: 'c6',
        senderName: 'Evalyn the Dragon Girl',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-5.jpg',
        sentAt: 'Yesterday at 10:16 PM',
        text: "Atleast I haven't been called in to orbital strike anything",
    },
    {
        id: 'c7',
        senderName: 'FREDerich von x86-64',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-6.jpg',
        sentAt: 'Yesterday at 10:18 PM',
        text: 'when you think about it, orbital strike weapons are quite impractical if you have ICBMs anyway',
    },
    {
        id: 'c8',
        senderName: 'Microsoft® sponsored NT™ fanboy',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-4.jpg',
        sentAt: 'Yesterday at 10:19 PM',
        text: 'defaulting to they/them usually works, as most people are fine with them',
    },
    {
        id: 'c9',
        senderName: 'Cat',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-2.jpg',
        sentAt: 'Yesterday at 10:19 PM',
        text: "You used to see my messages. So don't act as if you magically forgot all the conversations. The world doesn't work like this",
    },
    {
        id: 'c10',
        senderName: 'Evalyn the Dragon Girl',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-5.jpg',
        sentAt: 'Yesterday at 10:20 PM',
        text: 'This is what I have been doing for like several years atp',
    },
];

const DM_MESSAGES: MockMessage[] = [
    {
        id: 'd1',
        senderName: 'Litispendence',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-6.jpg',
        sentAt: 'Yesterday at 10:14 PM',
        text: 'Not worth it. It only causes more arguments and makes people behave terribly, without anyone changing their perspective or learning anything',
    },
    {
        id: 'd2',
        senderName: 'Litispendence',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-6.jpg',
        sentAt: 'Yesterday at 10:16 PM',
        text: 'It always happens on platforms like Discord, or even Reddit',
    },
    {
        id: 'd3',
        senderName: 'Litispendence',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-6.jpg',
        sentAt: 'Yesterday at 10:19 PM',
        text: 'I do not see the messages of Cat. Or the profile',
    },
    {
        id: 'd4',
        senderName: 'Litispendence',
        senderAvatar: 'https://rolling.catfla.re/images/servals/serval-6.jpg',
        sentAt: 'Yesterday at 10:19 PM',
        text: 'oh right. due to the events of yesterday',
    },
];

function HighlightedText({
    text,
    query,
}: {
    text: string;
    query: string;
}): ReactNode {
    if (!query.trim()) return <>{text}</>;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark
                        key={i}
                        style={{
                            backgroundColor: colors.primary,
                            color: 'var(--foreground-inverse)',
                            borderRadius: '2px',
                            padding: '0 2px',
                            fontWeight: fontWeight.semibold,
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    part
                ),
            )}
        </>
    );
}

interface ResultCardProps {
    message: MockMessage;
    query: string;
}

function ResultCard({ message, query }: ResultCardProps): ReactNode {
    return (
        <div
            style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '10px 16px',
                borderBottom: `1px solid ${colors.borderSubtle}`,
                cursor: 'pointer',
                transition: 'background-color 0.12s',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    colors.bgSubtle;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    'transparent';
            }}
        >
            <div style={{ marginTop: 2 }}>
                <UserProfilePicture
                    noIndicator
                    size="sm"
                    src={message.senderAvatar}
                    username={message.senderName}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 2,
                    }}
                >
                    <Text size="sm" weight="semibold">
                        {message.senderName}
                    </Text>
                    <Text size="xs" variant="muted">
                        {message.sentAt}
                    </Text>
                </div>
                <Text leading="normal" size="sm" wrap="breakAll">
                    <HighlightedText query={query} text={message.text} />
                </Text>
            </div>
        </div>
    );
}

interface MockChatHeaderProps {
    icon: ReactNode;
    name: string;
    isSearchOpen: boolean;
    onToggleSearch: () => void;
}

function MockChatHeader({
    icon,
    name,
    isSearchOpen,
    onToggleSearch,
}: MockChatHeaderProps): ReactNode {
    const iconBtnStyle = (active: boolean): CSSProperties => ({
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        border: 'none',
        background: active ? colors.bgSubtle : 'transparent',
        color: active ? colors.foreground : colors.mutedForeground,
        cursor: 'pointer',
        transition: 'background-color 0.12s, color 0.12s',
        flexShrink: 0,
    });

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderBottom: `1px solid ${colors.borderSubtle}`,
                backgroundColor: colors.bgSubtle,
            }}
        >
            <div
                style={{
                    color: colors.mutedForeground,
                    flexShrink: 0,
                    display: 'flex',
                }}
            >
                {icon}
            </div>
            <Text
                size="sm"
                style={{ flex: 1, minWidth: 0 }}
                weight="semibold"
                wrap="nowrap"
            >
                {name}
            </Text>
            <button
                aria-label={isSearchOpen ? 'Close search' : 'Search messages'}
                style={iconBtnStyle(isSearchOpen)}
                type="button"
                onClick={onToggleSearch}
                onMouseEnter={(e) => {
                    if (!isSearchOpen)
                        (e.currentTarget as HTMLButtonElement).style.color =
                            colors.foreground;
                }}
                onMouseLeave={(e) => {
                    if (!isSearchOpen)
                        (e.currentTarget as HTMLButtonElement).style.color =
                            colors.mutedForeground;
                }}
            >
                <Search size={18} />
            </button>
        </div>
    );
}

interface SearchPanelProps {
    messages: MockMessage[];
    onClose: () => void;
}

function SearchPanel({ messages, onClose }: SearchPanelProps): ReactNode {
    const [query, setQuery] = useState('');
    const trimmedQuery = query.trim();
    const debouncedQuery = useDebounce(trimmedQuery, 450);
    const isSearching =
        trimmedQuery.length > 0 && debouncedQuery !== trimmedQuery;
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        if (!q) return [];
        return messages.filter((m) => m.text.toLowerCase().includes(q));
    }, [debouncedQuery, messages]);

    const hasQuery = query.trim().length > 0;

    return (
        <m.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: -6 }}
            style={{
                borderBottom: `1px solid ${colors.borderSubtle}`,
                backgroundColor: colors.background,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onAnimationComplete={() => inputRef.current?.focus()}
        >
            {/* search bar row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderBottom: hasQuery
                        ? `1px solid ${colors.borderSubtle}`
                        : 'none',
                }}
            >
                <div style={{ flex: 1 }}>
                    <Input
                        icon={<Search size={14} />}
                        placeholder="Search in this conversation…"
                        ref={inputRef}
                        size="sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button
                    aria-label="Close search"
                    style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: radius.md,
                        border: 'none',
                        background: 'transparent',
                        color: colors.mutedForeground,
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                    type="button"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>

            {/* results */}
            {hasQuery && (
                <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    {isSearching ? (
                        [0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'flex-start',
                                    padding: '10px 16px',
                                    borderBottom: `1px solid ${colors.borderSubtle}`,
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: radius.full,
                                        backgroundColor: colors.bgSecondary,
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'baseline',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: 10,
                                                width: 80 + i * 20,
                                                borderRadius: radius.sm,
                                                backgroundColor:
                                                    colors.bgSecondary,
                                            }}
                                        />
                                        <div
                                            style={{
                                                height: 8,
                                                width: 44,
                                                borderRadius: radius.sm,
                                                backgroundColor:
                                                    colors.bgSecondary,
                                                opacity: 0.6,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            height: 9,
                                            width: `${75 + i * 7}%`,
                                            borderRadius: radius.sm,
                                            backgroundColor: colors.bgSecondary,
                                            opacity: 0.7,
                                        }}
                                    />
                                    <div
                                        style={{
                                            height: 9,
                                            width: `${40 + i * 10}%`,
                                            borderRadius: radius.sm,
                                            backgroundColor: colors.bgSecondary,
                                            opacity: 0.5,
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : results.length === 0 ? (
                        <div
                            style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                            }}
                        >
                            <Text size="sm" variant="muted">
                                No messages found for &ldquo;{debouncedQuery}
                                &rdquo;
                            </Text>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    padding: '6px 16px 4px',
                                }}
                            >
                                <Text size="xs" variant="muted">
                                    {results.length} result
                                    {results.length !== 1 ? 's' : ''}
                                </Text>
                            </div>
                            {results.map((msg) => (
                                <ResultCard
                                    key={msg.id}
                                    message={msg}
                                    query={debouncedQuery}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </m.div>
    );
}

interface ChatSearchPreviewProps {
    icon: ReactNode;
    name: string;
    messages: MockMessage[];
    defaultOpen?: boolean;
}

function ChatSearchPreview({
    icon,
    name,
    messages,
    defaultOpen = false,
}: ChatSearchPreviewProps): ReactNode {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            style={{
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: radius.lg,
                overflow: 'hidden',
                boxShadow: shadow.md,
                backgroundColor: colors.background,
            }}
        >
            <MockChatHeader
                icon={icon}
                isSearchOpen={open}
                name={name}
                onToggleSearch={() => setOpen((v) => !v)}
            />
            <AnimatePresence>
                {open && (
                    <SearchPanel
                        messages={messages}
                        onClose={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>
            {/* fake message list placeholder, hidden while search is open */}
            <div
                style={{
                    display: open ? 'none' : 'flex',
                    flexDirection: 'column',
                    padding: '12px 16px',
                    gap: 12,
                }}
            >
                {messages.slice(0, 3).map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                        }}
                    >
                        <div style={{ marginTop: 2, opacity: 0.4 }}>
                            <UserProfilePicture
                                noIndicator
                                size="sm"
                                src={msg.senderAvatar}
                                username={msg.senderName}
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'baseline',
                                }}
                            >
                                <div
                                    style={{
                                        height: 10,
                                        width: 72,
                                        borderRadius: radius.sm,
                                        backgroundColor: colors.bgSecondary,
                                    }}
                                />
                                <div
                                    style={{
                                        height: 8,
                                        width: 48,
                                        borderRadius: radius.sm,
                                        backgroundColor: colors.bgSecondary,
                                        opacity: 0.6,
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    height: 9,
                                    width: '85%',
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.bgSecondary,
                                    opacity: 0.5,
                                }}
                            />
                        </div>
                    </div>
                ))}
                <Text
                    align="center"
                    size="xs"
                    style={{ paddingTop: 4, paddingBottom: 4 }}
                    variant="muted"
                >
                    ↑ click the{' '}
                    <Search
                        size={11}
                        style={{ display: 'inline', verticalAlign: 'middle' }}
                    />{' '}
                    icon above to try it
                </Text>
            </div>
        </div>
    );
}

export function SearchDemo(): ReactNode {
    return (
        <DemoSection id="search" title="Message Search (in Chat Headers)">
            <div
                style={{
                    display: 'flex',
                    gap: 24,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                }}
            >
                {/* server channel */}
                <div style={{ flex: '1 1 300px', maxWidth: 480 }}>
                    <Text
                        as="p"
                        size="xs"
                        style={{ marginBottom: 8 }}
                        variant="muted"
                    >
                        Server channel
                    </Text>
                    <ChatSearchPreview
                        defaultOpen
                        icon={<Hash size={18} />}
                        messages={CHANNEL_MESSAGES}
                        name="general"
                    />
                </div>

                {/* DM */}
                <div style={{ flex: '1 1 300px', maxWidth: 480 }}>
                    <Text
                        as="p"
                        size="xs"
                        style={{ marginBottom: 8 }}
                        variant="muted"
                    >
                        Direct message
                    </Text>
                    <ChatSearchPreview
                        icon={<MessageCircle size={18} />}
                        messages={DM_MESSAGES}
                        name="hexagon"
                    />
                </div>
            </div>
        </DemoSection>
    );
}
