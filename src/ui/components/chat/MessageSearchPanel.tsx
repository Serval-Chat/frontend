import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import type { LexicalEditor } from 'lexical';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

import { useMessageSearch } from '@/api/chat/chat.queries';
import type { SearchFilters, SearchHit } from '@/api/chat/chat.types';
import {
    useCategories,
    useChannels,
    useMembers,
    useRoles,
    useServerDetails,
    useSticker,
} from '@/api/servers/servers.queries';
import type { Role, ServerMember } from '@/api/servers/servers.types';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useMemberMaps } from '@/hooks/chat/useMemberMaps';
import { useDebounce } from '@/hooks/useDebounce';
import { MessageHeader } from '@/ui/components/chat/MessageHeader';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { EmbedRenderer } from '@/ui/components/embed/EmbedRenderer';
import { colors, radius } from '@/ui/theme';
import { resolveApiUrl } from '@/utils/apiUrl';
import { getAllowedMessageFeatures } from '@/utils/markdownBlockade';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

import { SearchFilterNode } from './lexical/SearchFilterNode';
import { SearchFilterPlugin } from './lexical/SearchFilterPlugin';
import { insertSearchToken } from './lexical/searchTokenUtils';

const PAGE_SIZE = 25;

const handleSearchKeyDown = (e: {
    key: string;
    preventDefault(): void;
}): void => {
    if (e.key === 'Enter') e.preventDefault();
};

const searchContentEditableStyle: React.CSSProperties = {
    padding: '6px 10px 6px 32px',
    borderRadius: radius.md,
    border: `1px solid ${colors.borderSubtle}`,
    backgroundColor: colors.bgSubtle,
    color: colors.foreground,
    fontSize: '0.8rem',
    lineHeight: '1.5',
    minHeight: '32px',
    maxHeight: '80px',
    overflowY: 'auto',
    cursor: 'text',
    wordBreak: 'break-word',
};

const SEARCH_CONTENT_EDITABLE = (
    <ContentEditable
        className="outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
        style={searchContentEditableStyle}
        onKeyDown={handleSearchKeyDown}
    />
);

const SEARCH_BOX_CONFIG = {
    namespace: 'MessageSearch',
    nodes: [SearchFilterNode],
    onError: (e: Error) => {
        console.error('[SearchBox]', e);
    },
    theme: {},
};

const navButtonStyle = (enabled: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    border: 'none',
    background: 'transparent',
    color: enabled ? colors.foreground : colors.mutedForeground,
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.35,
    flexShrink: 0,
});

const searchPlaceholderStyle: React.CSSProperties = {
    position: 'absolute',
    left: 32,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.placeholder,
    fontSize: '0.8rem',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
};

const measurePlaceholderStyle: React.CSSProperties = {
    ...searchPlaceholderStyle,
    left: 0,
    visibility: 'hidden',
};

const SEARCH_PLACEHOLDER_FULL = 'Search... (e.g. from:alice in:general)';
const SEARCH_PLACEHOLDER_SHORT = 'Search...';
const SEARCH_PLACEHOLDER_LEFT_INSET = 32;

const closeSearchButtonStyle: React.CSSProperties = {
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
};

const searchChipButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: radius.full,
    border: `1px solid ${colors.borderSubtle}`,
    background: 'transparent',
    color: colors.foreground,
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'background-color 0.12s, border-color 0.12s',
    whiteSpace: 'nowrap',
};

interface MessageSearchPanelProps {
    mode: 'dm' | 'channel';
    otherUserId?: string;
    serverId?: string;
    channelId?: string;
    onClose: () => void;
    onNavigateToMessage: (messageId: string) => void;
}

function SkeletonRows() {
    return (
        <>
            {[0, 1, 2, 3, 4].map((i) => (
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
                                    width: 80 + (i % 3) * 24,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.bgSecondary,
                                }}
                            />
                            <div
                                style={{
                                    height: 8,
                                    width: 44,
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.bgSecondary,
                                    opacity: 0.6,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                height: 9,
                                width: `${70 + (i % 3) * 9}%`,
                                borderRadius: radius.sm,
                                backgroundColor: colors.bgSecondary,
                                opacity: 0.7,
                            }}
                        />
                        <div
                            style={{
                                height: 9,
                                width: `${38 + (i % 3) * 12}%`,
                                borderRadius: radius.sm,
                                backgroundColor: colors.bgSecondary,
                                opacity: 0.5,
                            }}
                        />
                    </div>
                </div>
            ))}
        </>
    );
}

export function SearchResultItem({
    hit,
    query,
    onNavigate,
    fullMemberMap,
    highestRoleMap,
    iconRoleMap,
    disableColors,
    disableCustomFonts,
    disableGlow,
    disableGlowAndColors,
}: {
    hit: SearchHit;
    query: string;
    onNavigate: (id: string) => void;
    fullMemberMap?: Map<string, ServerMember>;
    highestRoleMap?: Map<string, Role>;
    iconRoleMap?: Map<string, Role>;
    disableColors?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    disableGlowAndColors?: boolean;
}) {
    const fullMember = fullMemberMap?.get(hit.senderId);
    // only fetch from API when member data is unavailable (DM mode or user left server)
    const { data: fetchedUser } = useUserById(hit.senderId, {
        enabled: !hit.isWebhook && !fullMember,
    });
    // mirror Message.hooks.ts: spread server nickname onto the base user object
    const memberUser = fullMember
        ? fullMember.nickname
            ? { ...fullMember.user, nickname: fullMember.nickname }
            : fullMember.user
        : undefined;
    const { data: sticker } = useSticker(hit.stickerId ?? null);
    const nodes = useMemo(
        () =>
            parseText(hit.text, {
                ...ParserPresets.MESSAGE,
                features: getAllowedMessageFeatures([]),
            }),
        [hit.text],
    );

    const role = highestRoleMap?.get(hit.senderId);
    const iconRole = iconRoleMap?.get(hit.senderId);

    const webhookAvatarUrl = hit.webhookAvatarUrl;
    const proxiedWebhookAvatar =
        webhookAvatarUrl &&
        (webhookAvatarUrl.startsWith('https://') ||
            webhookAvatarUrl.startsWith('http://'))
            ? `/api/v1/embed/proxy?url=${encodeURIComponent(webhookAvatarUrl)}`
            : webhookAvatarUrl;
    const user = hit.isWebhook
        ? {
              id: hit.senderId,
              login: hit.webhookUsername ?? 'Webhook',
              username: hit.webhookUsername ?? 'Webhook',
              profilePicture: proxiedWebhookAvatar,
              createdAt: new Date(hit.createdAt),
          }
        : (memberUser ?? fetchedUser);

    if (!user) {
        return (
            <div
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
                        width: 40,
                        height: 40,
                        borderRadius: radius.full,
                        backgroundColor: colors.bgSecondary,
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        paddingTop: 4,
                    }}
                >
                    <div
                        style={{
                            height: 10,
                            width: 100,
                            borderRadius: radius.sm,
                            backgroundColor: colors.bgSecondary,
                        }}
                    />
                    <div
                        style={{
                            height: 9,
                            width: '70%',
                            borderRadius: radius.sm,
                            backgroundColor: colors.bgSecondary,
                            opacity: 0.7,
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <button
            aria-label="Navigate to message"
            className="group relative flex w-full flex-col text-left transition-all duration-150 hover:bg-white/2"
            style={{
                background: 'none',
                border: 'none',
                borderBottom: `1px solid ${colors.borderSubtle}`,
                cursor: 'pointer',
                padding: 0,
            }}
            type="button"
            onClick={() => {
                onNavigate(hit.id);
            }}
        >
            <div className="flex items-start gap-1 px-4 py-0.5">
                <div className="mt-1 flex w-12 shrink-0 justify-center">
                    <UserProfilePicture
                        noIndicator
                        size="md"
                        src={user.profilePicture}
                        username={user.username}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <MessageHeader
                        isGroupStart
                        disableColors={disableColors}
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        disableGlowAndColors={disableGlowAndColors}
                        iconRole={iconRole}
                        isWebhook={hit.isWebhook ? !user.isBot : undefined}
                        role={role}
                        timestamp={hit.createdAt}
                        user={user}
                    />
                    <div className="search-highlight text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground">
                        {hit.text ? (
                            <ParsedText
                                highlightQuery={query}
                                nodes={nodes}
                                serverId={hit.serverId}
                                wrap="preWrap"
                            />
                        ) : null}
                        {hit.embeds && hit.embeds.length > 0 ? (
                            <EmbedRenderer
                                channelId={hit.channelId}
                                messageId={hit.id}
                                payload={{
                                    embeds: hit.embeds,
                                    components: undefined,
                                    content: undefined,
                                }}
                                serverId={hit.serverId}
                                variant="chat"
                            />
                        ) : null}
                        {sticker ? (
                            <img
                                alt={sticker.name}
                                className="mt-1 max-w-50"
                                src={resolveApiUrl(sticker.imageUrl) ?? ''}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </button>
    );
}

const SearchFilterShortcuts = ({
    mode,
    onAppend,
}: {
    mode: MessageSearchPanelProps['mode'];
    onAppend: (token: string) => void;
}) => (
    <div style={{ padding: '20px 16px' }}>
        <Text size="xs" variant="muted">
            Filter shortcuts - click to add:
        </Text>
        {[
            {
                label: 'Who',
                chips: [
                    { token: 'from:', label: 'from: user' },
                    { token: 'mentions:', label: 'mentions: user' },
                ],
            },
            {
                label: 'Has',
                chips: [
                    { token: 'has:file ', label: 'has: file' },
                    { token: 'has:embed ', label: 'has: embed' },
                    { token: 'has:link ', label: 'has: link' },
                ],
            },
            {
                label: 'State',
                chips: [
                    { token: 'pinned:true ', label: 'pinned: true' },
                    { token: 'pinned:false ', label: 'pinned: false' },
                ],
            },
            {
                label: 'Author',
                chips: [
                    { token: 'type:user ', label: 'type: user' },
                    { token: 'type:bot ', label: 'type: bot' },
                    { token: 'type:webhook ', label: 'type: webhook' },
                ],
            },
            {
                label: 'Date',
                chips: [
                    { token: 'before:', label: 'before: date' },
                    { token: 'after:', label: 'after: date' },
                ],
            },
            {
                label: 'Match',
                chips: [{ token: 'strict:', label: 'strict: word' }],
            },
            ...(mode === 'channel'
                ? [
                      {
                          label: 'Channel',
                          chips: [
                              { token: 'in:', label: 'in: channel' },
                              { token: 'inc:', label: 'inc: category' },
                          ],
                      },
                  ]
                : []),
        ].map(({ label, chips }) => (
            <div key={label} style={{ marginTop: 14 }}>
                <Text
                    size="xs"
                    style={
                        {
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontSize: '0.65rem',
                            marginBottom: 6,
                            display: 'block',
                        } as React.CSSProperties
                    }
                    variant="muted"
                >
                    {label}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {chips.map(({ token, label: chipLabel }) => (
                        <button
                            key={token}
                            style={searchChipButtonStyle}
                            type="button"
                            onClick={() => {
                                onAppend(token);
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = colors.bgSubtle;
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor = colors.mutedForeground;
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = 'transparent';
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.borderColor = colors.borderSubtle;
                            }}
                        >
                            {chipLabel}
                        </button>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export function MessageSearchPanel({
    mode,
    otherUserId,
    serverId,
    channelId,
    onClose,
    onNavigateToMessage,
}: MessageSearchPanelProps) {
    const [liveState, setLiveState] = useState<{
        q: string;
        filters: SearchFilters;
    }>({
        q: '',
        filters: {},
    });
    const [pageState, setPageState] = useState({ page: 0, forKey: '' });
    const lexicalEditorRef = useRef<LexicalEditor | null>(null);
    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const placeholderMeasureRef = useRef<HTMLSpanElement>(null);
    const [placeholderTooWide, setPlaceholderTooWide] = useState(false);

    useEffect(() => {
        const wrapper = editorWrapperRef.current;
        const measure = placeholderMeasureRef.current;
        if (!wrapper || !measure) return;

        const checkFit = (): void => {
            const availableWidth =
                wrapper.clientWidth - SEARCH_PLACEHOLDER_LEFT_INSET;
            setPlaceholderTooWide(measure.scrollWidth > availableWidth);
        };

        checkFit();

        const observer = new ResizeObserver(checkFit);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    const { data: allChannels = [] } = useChannels(serverId ?? null, {
        enabled: mode === 'channel',
    });
    const { data: allCategories = [] } = useCategories(serverId ?? null, {
        enabled: mode === 'channel',
    });
    const { data: members } = useMembers(serverId ?? null, {
        enabled: mode === 'channel',
    });
    const { data: roles } = useRoles(serverId ?? null, {
        enabled: mode === 'channel',
    });
    const { data: serverDetails } = useServerDetails(serverId ?? null, {
        enabled: mode === 'channel',
    });
    const { data: currentUser } = useMe();
    const { fullMemberMap, highestRoleMap, iconRoleMap } = useMemberMaps(
        members,
        roles,
    );

    const disableColors = currentUser?.settings?.disableCustomUsernameColors;
    const disableCustomFonts =
        serverDetails?.disableCustomFonts ||
        currentUser?.settings?.disableCustomUsernameFonts;
    const disableGlow = currentUser?.settings?.disableCustomUsernameGlow;
    const disableGlowAndColors =
        serverDetails?.disableUsernameGlowAndCustomColor;

    // debounce both dimensions of the live state separately
    const debouncedQ = useDebounce(liveState.q, 450);
    const debouncedFiltersJson = useDebounce(
        JSON.stringify(liveState.filters),
        450,
    );
    const debouncedFilters = useMemo(
        () => JSON.parse(debouncedFiltersJson) as SearchFilters,
        [debouncedFiltersJson],
    );

    const hasInput =
        liveState.q.trim().length > 0 ||
        Object.values(liveState.filters).some((v) => v !== undefined);

    // reset to page 0 whenever the committed query changes (render-time derived state,
    // avoids both ref-during-render and setState-in-effect)
    const committedKey = `${debouncedQ}:${debouncedFiltersJson}`;
    const page = pageState.forKey === committedKey ? pageState.page : 0;
    if (pageState.forKey !== committedKey) {
        setPageState({ page: 0, forKey: committedKey });
    }

    const { data, isFetching, isError } = useMessageSearch({
        mode,
        otherUserId,
        serverId,
        channelId,
        query: debouncedQ,
        page,
        filters: debouncedFilters,
    });

    const isLive =
        liveState.q !== debouncedQ ||
        JSON.stringify(liveState.filters) !== debouncedFiltersJson;
    const isSearching = hasInput && (isLive || isFetching);
    const totalPages =
        data && data.total > 0 ? Math.ceil(data.total / PAGE_SIZE) : 0;
    const canGoPrev = page > 0;
    const canGoNext = totalPages > 0 && page < totalPages - 1;

    const handleSearchChange = useCallback(
        (state: { q: string; filters: SearchFilters }) => {
            setLiveState(state);
        },
        [],
    );

    function appendToEditor(token: string) {
        if (!lexicalEditorRef.current) return;
        insertSearchToken(lexicalEditorRef.current, token);
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: colors.background,
                width: '100%',
            }}
        >
            {/* search editor row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderBottom: `1px solid ${colors.borderSubtle}`,
                    flexShrink: 0,
                }}
            >
                {/* editor wrapper, position context for dropdown + icon */}
                <div
                    ref={editorWrapperRef}
                    style={{ flex: 1, position: 'relative' }}
                >
                    {/* offscreen twin of the full placeholder, used only to measure whether it fits */}
                    <span
                        ref={placeholderMeasureRef}
                        style={measurePlaceholderStyle}
                    >
                        {SEARCH_PLACEHOLDER_FULL}
                    </span>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: colors.mutedForeground,
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />

                    <LexicalComposer initialConfig={SEARCH_BOX_CONFIG}>
                        {/* plain text editor, no markdown formatting */}
                        <div style={{ position: 'relative' }}>
                            <PlainTextPlugin
                                ErrorBoundary={LexicalErrorBoundary}
                                contentEditable={SEARCH_CONTENT_EDITABLE}
                                placeholder={
                                    <span style={searchPlaceholderStyle}>
                                        {placeholderTooWide
                                            ? SEARCH_PLACEHOLDER_SHORT
                                            : SEARCH_PLACEHOLDER_FULL}
                                    </span>
                                }
                            />
                        </div>
                        <HistoryPlugin />
                        {/* handles token detection, chip insertion, and channel autocomplete dropdown */}
                        <SearchFilterPlugin
                            categories={allCategories}
                            channels={allChannels}
                            editorRef={lexicalEditorRef}
                            members={members ?? []}
                            onChange={handleSearchChange}
                        />
                    </LexicalComposer>
                </div>

                <button
                    aria-label="Close search"
                    style={closeSearchButtonStyle}
                    type="button"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>

            {/* results count */}
            {hasInput && !isSearching && data && data.total > 0 ? (
                <div
                    style={{
                        padding: '5px 16px 4px',
                        borderBottom: `1px solid ${colors.borderSubtle}`,
                        flexShrink: 0,
                    }}
                >
                    <Text size="xs" variant="muted">
                        {data.total} result{data.total === 1 ? '' : 's'}
                        {totalPages > 1
                            ? `  -  page ${page + 1} of ${totalPages}`
                            : null}
                    </Text>
                </div>
            ) : null}

            {/* scrollable results */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {hasInput ? (
                    isSearching ? (
                        <SkeletonRows />
                    ) : isError ? (
                        <div
                            style={{
                                padding: '28px 16px',
                                textAlign: 'center',
                            }}
                        >
                            <Text size="sm" variant="muted">
                                Search is unavailable right now.
                            </Text>
                        </div>
                    ) : !data || data.hits.length === 0 ? (
                        <div
                            style={{
                                padding: '28px 16px',
                                textAlign: 'center',
                            }}
                        >
                            <Text size="sm" variant="muted">
                                No messages found.
                            </Text>
                        </div>
                    ) : (
                        data.hits.map((hit) => (
                            <SearchResultItem
                                disableColors={disableColors}
                                disableCustomFonts={disableCustomFonts}
                                disableGlow={disableGlow}
                                disableGlowAndColors={disableGlowAndColors}
                                fullMemberMap={fullMemberMap}
                                highestRoleMap={highestRoleMap}
                                hit={hit}
                                iconRoleMap={iconRoleMap}
                                key={hit.id}
                                query={debouncedQ}
                                onNavigate={onNavigateToMessage}
                            />
                        ))
                    )
                ) : (
                    <SearchFilterShortcuts
                        mode={mode}
                        onAppend={appendToEditor}
                    />
                )}
            </div>

            {/* pagination controls */}
            {hasInput && !isSearching && totalPages > 1 ? (
                <div
                    style={{
                        borderTop: `1px solid ${colors.borderSubtle}`,
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <button
                        disabled={!canGoPrev}
                        style={navButtonStyle(canGoPrev)}
                        type="button"
                        onClick={() => {
                            setPageState({
                                page: page - 1,
                                forKey: committedKey,
                            });
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <Text size="xs" variant="muted">
                        {page + 1} / {totalPages}
                    </Text>
                    <button
                        disabled={!canGoNext}
                        style={navButtonStyle(canGoNext)}
                        type="button"
                        onClick={() => {
                            setPageState({
                                page: page + 1,
                                forKey: committedKey,
                            });
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
