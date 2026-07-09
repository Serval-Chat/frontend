import {
    type CSSProperties,
    type MutableRefObject,
    useCallback,
    useEffect,
    useReducer,
    useState,
} from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getRoot,
    $isTextNode,
    ElementNode,
    type LexicalEditor,
    TextNode,
} from 'lexical';
import {
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Hash,
    Minus,
    Plus,
} from 'lucide-react';

import type { SearchFilters } from '@/api/chat/chat.types';
import type {
    Category,
    Channel,
    ServerMember,
} from '@/api/servers/servers.types';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { colors, radius } from '@/ui/theme';
import { mergeReducer } from '@/utils/mergeReducer';

import {
    $createSearchFilterNode,
    $isSearchFilterNode,
    type SearchFilterData,
} from './SearchFilterNode';

const TOKEN_RE =
    /(^|\s)(-?)(from|mentions|has|pinned|before|after|strict|type|in|inc):(\S+)(?=\s)/;

function makeFilterData(
    neg: string,
    key: string,
    val: string,
    channels: Channel[],
    categories: Category[],
): SearchFilterData | null {
    const negated = neg === '-';
    switch (key) {
        case 'from': {
            return {
                filterKey: negated ? 'notFromUser' : 'fromUser',
                filterValue: val,
                label: 'from',
                display: val,
                negated,
            };
        }
        case 'mentions': {
            return {
                filterKey: negated ? 'notMentionsUser' : 'mentionsUser',
                filterValue: val,
                label: 'mentions',
                display: val,
                negated,
            };
        }
        case 'has': {
            if (val === 'file')
                return {
                    filterKey: negated ? 'notHasFile' : 'hasFile',
                    filterValue: true,
                    label: 'has',
                    display: 'file',
                    negated,
                };
            if (val === 'embed')
                return {
                    filterKey: negated ? 'notHasEmbed' : 'hasEmbed',
                    filterValue: true,
                    label: 'has',
                    display: 'embed',
                    negated,
                };
            if (val === 'link')
                return {
                    filterKey: negated ? 'notHasLink' : 'hasLink',
                    filterValue: true,
                    label: 'has',
                    display: 'link',
                    negated,
                };
            return null;
        }
        case 'pinned': {
            return negated
                ? {
                      filterKey: 'notIsPinned',
                      filterValue: val !== 'false',
                      label: 'pinned',
                      display: val,
                      negated: true,
                  }
                : {
                      filterKey: 'isPinned',
                      filterValue: val !== 'false',
                      label: 'pinned',
                      display: val,
                      negated: false,
                  };
        }
        case 'type': {
            if (val === 'user' || val === 'bot' || val === 'webhook')
                return {
                    filterKey: negated ? 'notAuthorType' : 'authorType',
                    filterValue: val,
                    label: 'type',
                    display: val,
                    negated,
                };
            return null;
        }
        case 'strict': {
            return {
                filterKey: negated ? 'notStrict' : 'strict',
                filterValue: val,
                label: 'strict',
                display: val,
                negated,
            };
        }
        case 'before': {
            return negated
                ? null
                : {
                      filterKey: 'before',
                      filterValue: val,
                      label: 'before',
                      display: val,
                      negated: false,
                  };
        }
        case 'after': {
            return negated
                ? null
                : {
                      filterKey: 'after',
                      filterValue: val,
                      label: 'after',
                      display: val,
                      negated: false,
                  };
        }
        case 'in': {
            if (negated) return null;
            const ch = channels.find((c) => c.id === val);
            return {
                filterKey: 'inChannel',
                filterValue: val,
                label: 'in',
                display: ch ? `#${ch.name}` : `#${val}`,
                negated: false,
            };
        }
        case 'inc': {
            const cat = categories.find((c) => c.id === val);
            return {
                filterKey: negated ? 'notInCategory' : 'inCategory',
                filterValue: cat?.id ?? val,
                label: 'inc',
                display: cat ? cat.name : val,
                negated,
            };
        }
        default: {
            return null;
        }
    }
}

function $extractSearchState(): { q: string; filters: SearchFilters } {
    const filters: SearchFilters = {};
    const qParts: string[] = [];
    for (const child of $getRoot().getChildren()) {
        if (!(child instanceof ElementNode)) continue;
        for (const node of child.getChildren()) {
            if ($isTextNode(node)) {
                qParts.push(node.getTextContent());
            } else if ($isSearchFilterNode(node)) {
                const { filterKey, filterValue } = node.getData();
                if (filterKey === 'inChannel') {
                    filters.inChannel = [
                        ...(filters.inChannel ?? []),
                        filterValue as string,
                    ];
                } else if (filterKey === 'inCategory') {
                    filters.inCategory = [
                        ...(filters.inCategory ?? []),
                        filterValue as string,
                    ];
                } else if (filterKey === 'notInCategory') {
                    filters.notInCategory = [
                        ...(filters.notInCategory ?? []),
                        filterValue as string,
                    ];
                } else {
                    (filters as Record<string, unknown>)[filterKey] =
                        filterValue;
                }
            }
        }
    }
    return { q: qParts.join('').trim(), filters };
}

function $getInPartial(): string | null {
    const parts: string[] = [];
    for (const child of $getRoot().getChildren()) {
        if (!(child instanceof ElementNode)) continue;
        for (const node of child.getChildren()) {
            if ($isTextNode(node)) parts.push(node.getTextContent());
        }
    }
    // match `in:partial` but NOT `inc:partial`
    const m = /(?:^|\s)-?in:(\S*)$/i.exec(parts.join(''));
    // the capture group is mandatory in the regex, so a match guarantees it.
    return m ? m[1]!.toLowerCase() : null;
}

function $getIncPartial(): string | null {
    const parts: string[] = [];
    for (const child of $getRoot().getChildren()) {
        if (!(child instanceof ElementNode)) continue;
        for (const node of child.getChildren()) {
            if ($isTextNode(node)) parts.push(node.getTextContent());
        }
    }
    const m = /(?:^|\s)-?inc:(\S*)$/i.exec(parts.join(''));
    // the capture group is mandatory in the regex, so a match guarantees it.
    return m ? m[1]!.toLowerCase() : null;
}

function $getUserPartial(): { key: string; partial: string } | null {
    const parts: string[] = [];
    for (const child of $getRoot().getChildren()) {
        if (!(child instanceof ElementNode)) continue;
        for (const node of child.getChildren()) {
            if ($isTextNode(node)) parts.push(node.getTextContent());
        }
    }
    const m = /(?:^|\s)-?(from|mentions):(\S*)$/i.exec(parts.join(''));
    if (!m) return null;
    // both capture groups are mandatory in the regex, so a match guarantees them.
    return { key: m[1]!.toLowerCase(), partial: m[2]!.toLowerCase() };
}

function $getDatePartial(): { key: string; partial: string } | null {
    const parts: string[] = [];
    for (const child of $getRoot().getChildren()) {
        if (!(child instanceof ElementNode)) continue;
        for (const node of child.getChildren()) {
            if ($isTextNode(node)) parts.push(node.getTextContent());
        }
    }
    const m = /(?:^|\s)(before|after):(\S*)$/i.exec(parts.join(''));
    if (!m) return null;
    // both capture groups are mandatory in the regex, so a match guarantees them.
    return { key: m[1]!.toLowerCase(), partial: m[2]! };
}

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const navBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--foreground)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '0 6px',
};

const spinBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
    padding: '0 5px',
    userSelect: 'none',
};

const calendarDayButtonStyle: CSSProperties = {
    padding: '4px 0',
    borderRadius: 4,
    border: 'none',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textAlign: 'center',
};

const confirmDateButtonStyle: CSSProperties = {
    marginTop: 10,
    width: '100%',
    padding: '5px 0',
    borderRadius: 4,
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: 600,
};

const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 50,
    marginTop: 4,
    backgroundColor: colors.background,
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
};

const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '6px 10px',
    border: 'none',
    background: 'transparent',
    color: colors.foreground,
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'left',
};

function TimeSpinner({
    value,
    max,
    onChange,
}: {
    value: number;
    max: number;
    onChange: (n: number) => void;
}) {
    const dec = () => {
        onChange(value <= 0 ? max : value - 1);
    };
    const inc = () => {
        onChange(value >= max ? 0 : value + 1);
    };
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
            }}
        >
            <button
                style={spinBtnStyle}
                type="button"
                onClick={dec}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                <Minus size={12} />
            </button>
            <span
                style={{
                    width: 22,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--foreground)',
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {String(value).padStart(2, '0')}
            </span>
            <button
                style={spinBtnStyle}
                type="button"
                onClick={inc}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                <Plus size={12} />
            </button>
        </div>
    );
}

function DateTimePicker({ onConfirm }: { onConfirm: (iso: string) => void }) {
    interface PickerState {
        viewYear: number;
        viewMonth: number;
        selDay: number | null;
        hour: number;
        minute: number;
        second: number;
    }
    const [picker, patchPicker] = useReducer(mergeReducer<PickerState>, {
        viewYear: new Date().getFullYear(),
        viewMonth: new Date().getMonth(),
        selDay: null,
        hour: 0,
        minute: 0,
        second: 0,
    });
    const { viewYear, viewMonth, selDay, hour, minute, second } = picker;
    const setViewYear = (v: number | ((p: number) => number)): void => {
        patchPicker(
            typeof v === 'function'
                ? (s): Partial<PickerState> => ({ viewYear: v(s.viewYear) })
                : { viewYear: v },
        );
    };
    const setViewMonth = (v: number | ((p: number) => number)): void => {
        patchPicker(
            typeof v === 'function'
                ? (s): Partial<PickerState> => ({ viewMonth: v(s.viewMonth) })
                : { viewMonth: v },
        );
    };
    const setSelDay = (v: number | null): void => {
        patchPicker({ selDay: v });
    };
    const setHour = (v: number): void => {
        patchPicker({ hour: v });
    };
    const setMinute = (v: number): void => {
        patchPicker({ minute: v });
    };
    const setSecond = (v: number): void => {
        patchPicker({ second: v });
    };

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    };

    const handleConfirm = () => {
        if (selDay === null) return;
        const pad = (n: number) => String(n).padStart(2, '0');
        onConfirm(
            `${viewYear}-${pad(viewMonth + 1)}-${pad(selDay)}T${pad(hour)}:${pad(minute)}:${pad(second)}`,
        );
    };

    return (
        <div style={{ padding: '10px 12px', minWidth: 228 }}>
            {/* month / year header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                }}
            >
                <button
                    style={navBtnStyle}
                    type="button"
                    onClick={prevMonth}
                    onMouseDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <ChevronLeft size={14} />
                </button>
                <span
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                    }}
                >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                    style={navBtnStyle}
                    type="button"
                    onClick={nextMonth}
                    onMouseDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* day-of-week labels */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                    marginBottom: 2,
                }}
            >
                {DAY_NAMES.map((d) => (
                    <span
                        key={d}
                        style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)',
                            padding: '2px 0',
                        }}
                    >
                        {d}
                    </span>
                ))}
            </div>

            {/* calendar grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                }}
            >
                {['gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6']
                    .slice(0, firstDow)
                    .map((key) => (
                        <span key={key} />
                    ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (d) => {
                        const sel = d === selDay;
                        return (
                            <button
                                key={d}
                                style={{
                                    ...calendarDayButtonStyle,
                                    background: sel
                                        ? 'var(--primary)'
                                        : 'transparent',
                                    color: sel ? '#fff' : 'var(--foreground)',
                                }}
                                type="button"
                                onClick={() => {
                                    setSelDay(d);
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onMouseEnter={(e) => {
                                    if (!sel)
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background = 'var(--bg-subtle)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!sel)
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background = 'transparent';
                                }}
                            >
                                {d}
                            </button>
                        );
                    },
                )}
            </div>

            {/* time row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 10,
                }}
            >
                <span
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-foreground)',
                        marginRight: 2,
                    }}
                >
                    Time
                </span>
                <TimeSpinner max={23} value={hour} onChange={setHour} />
                <span style={{ color: 'var(--muted-foreground)' }}>:</span>
                <TimeSpinner max={59} value={minute} onChange={setMinute} />
                <span style={{ color: 'var(--muted-foreground)' }}>:</span>
                <TimeSpinner max={59} value={second} onChange={setSecond} />
            </div>

            {/* confirm */}
            <button
                disabled={selDay === null}
                style={{
                    ...confirmDateButtonStyle,
                    background:
                        selDay === null ? 'var(--bg-subtle)' : 'var(--primary)',
                    color: selDay === null ? 'var(--muted-foreground)' : '#fff',
                    cursor: selDay === null ? 'default' : 'pointer',
                }}
                type="button"
                onClick={handleConfirm}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                Apply
            </button>
        </div>
    );
}

interface SearchFilterPluginProps {
    channels: Channel[];
    categories: Category[];
    members: ServerMember[];
    onChange: (state: { q: string; filters: SearchFilters }) => void;
    editorRef?: MutableRefObject<LexicalEditor | null>;
}

function SearchSuggestionsDropdown({
    suggestions,
    categorySuggestions,
    userSuggestions,
    showDatePicker,
    onSelectSuggestion,
    onSelectCategory,
    onSelectUser,
    onSelectDate,
}: {
    suggestions: Channel[];
    categorySuggestions: Category[];
    userSuggestions: ServerMember[];
    showDatePicker: boolean;
    onSelectSuggestion: (c: Channel) => void;
    onSelectCategory: (c: Category) => void;
    onSelectUser: (m: ServerMember) => void;
    onSelectDate: (iso: string) => void;
}) {
    return (
        <div style={dropdownStyle}>
            {suggestions.map((c) => (
                <button
                    key={c.id}
                    style={itemStyle}
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectSuggestion(c);
                    }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = colors.bgSubtle;
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = 'transparent';
                    }}
                >
                    <Hash
                        size={12}
                        style={{ color: colors.mutedForeground, flexShrink: 0 }}
                    />
                    {c.name}
                </button>
            ))}
            {categorySuggestions.map((c) => (
                <button
                    key={c.id}
                    style={itemStyle}
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectCategory(c);
                    }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = colors.bgSubtle;
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = 'transparent';
                    }}
                >
                    <FolderOpen
                        size={12}
                        style={{ color: colors.mutedForeground, flexShrink: 0 }}
                    />
                    {c.name}
                </button>
            ))}
            {userSuggestions.map((m) => (
                <button
                    key={m.userId}
                    style={itemStyle}
                    type="button"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectUser(m);
                    }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = colors.bgSubtle;
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = 'transparent';
                    }}
                >
                    <UserProfilePicture
                        noIndicator
                        size="xs"
                        src={m.user.profilePicture}
                        username={m.user.username}
                    />
                    <span style={{ fontWeight: 500 }}>
                        {m.nickname ?? m.user.displayName ?? m.user.username}
                    </span>
                    {m.nickname || m.user.displayName ? (
                        <span
                            style={{
                                color: colors.mutedForeground,
                                fontSize: '0.75rem',
                            }}
                        >
                            @{m.user.username}
                        </span>
                    ) : null}
                </button>
            ))}
            {showDatePicker ? (
                <DateTimePicker onConfirm={onSelectDate} />
            ) : null}
        </div>
    );
}

export function SearchFilterPlugin({
    channels,
    categories,
    members,
    onChange,
    editorRef,
}: SearchFilterPluginProps) {
    const [editor] = useLexicalComposerContext();
    const [suggestions, setSuggestions] = useState<Channel[]>([]);
    const [categorySuggestions, setCategorySuggestions] = useState<Category[]>(
        [],
    );
    const [userSuggestions, setUserSuggestions] = useState<ServerMember[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        // false positive: editor comes from Lexical's own composer context (an
        // external system), not a handler in this component, so there's no event
        // handler to move this ref sync into.
        // react-doctor-disable-next-line react-doctor/no-event-handler
        if (editorRef) editorRef.current = editor;
    }, [editor, editorRef]);

    // focus shortly after mount once the search panel's open animation settles.
    useEffect(() => {
        const timer = globalThis.setTimeout(() => {
            editor.focus();
        }, 80);
        return () => {
            globalThis.clearTimeout(timer);
        };
    }, [editor]);

    // detect completed filter tokens (space-terminated) and replace with chip nodes
    useEffect(
        () =>
            editor.registerNodeTransform(TextNode, (node) => {
                const text = node.getTextContent();
                const match = TOKEN_RE.exec(text);
                if (!match) return;

                // all capture groups in TOKEN_RE are mandatory (none are
                // optional groups), so a successful match guarantees them.
                const leading = match[1]!;
                const neg = match[2]!;
                const key = match[3]!;
                const val = match[4]!;
                const data = makeFilterData(
                    neg,
                    key,
                    val,
                    channels,
                    categories,
                );
                if (!data) return;

                const matchStart = match.index;
                const beforeText = text.slice(0, matchStart + leading.length);
                const afterText = text.slice(matchStart + match[0].length);

                const filterNode = $createSearchFilterNode(data);

                // order matters: insertAfter pushes existing next-siblings further right
                if (afterText) node.insertAfter($createTextNode(afterText));
                node.insertAfter(filterNode);
                if (beforeText) node.insertBefore($createTextNode(beforeText));
                node.remove();
            }),
        [editor, channels, categories],
    );

    // notify parent of extracted search state; update all suggestion dropdowns
    useEffect(
        () =>
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    onChange($extractSearchState());

                    const inPartial = $getInPartial();
                    if (inPartial !== null) {
                        setSuggestions(
                            channels
                                .filter(
                                    (c) =>
                                        c.type === 'text' &&
                                        (c.name
                                            .toLowerCase()
                                            .includes(inPartial) ||
                                            c.id.startsWith(inPartial)),
                                )
                                .slice(0, 8),
                        );
                        setCategorySuggestions([]);
                        setUserSuggestions([]);
                        setShowDatePicker(false);
                        return;
                    }

                    const incPartial = $getIncPartial();
                    if (incPartial !== null) {
                        setSuggestions([]);
                        setCategorySuggestions(
                            categories
                                .filter(
                                    (c) =>
                                        c.name
                                            .toLowerCase()
                                            .includes(incPartial) ||
                                        c.id.startsWith(incPartial),
                                )
                                .slice(0, 8),
                        );
                        setUserSuggestions([]);
                        setShowDatePicker(false);
                        return;
                    }

                    const userPartial = $getUserPartial();
                    if (userPartial !== null) {
                        setSuggestions([]);
                        setCategorySuggestions([]);
                        setUserSuggestions(
                            members
                                .filter((m) => {
                                    const p = userPartial.partial;
                                    if (!p) return true;
                                    const u = m.user;
                                    return (
                                        u.username.toLowerCase().includes(p) ||
                                        (u.displayName ?? '')
                                            .toLowerCase()
                                            .includes(p) ||
                                        (m.nickname ?? '')
                                            .toLowerCase()
                                            .includes(p)
                                    );
                                })
                                .slice(0, 8),
                        );
                        setShowDatePicker(false);
                        return;
                    }

                    const datePartial = $getDatePartial();
                    if (datePartial !== null) {
                        setSuggestions([]);
                        setCategorySuggestions([]);
                        setUserSuggestions([]);
                        setShowDatePicker(true);
                        return;
                    }

                    setSuggestions([]);
                    setCategorySuggestions([]);
                    setUserSuggestions([]);
                    setShowDatePicker(false);
                });
            }),
        [editor, channels, categories, members, onChange],
    );

    const selectSuggestion = useCallback(
        (channel: Channel) => {
            editor.update(() => {
                for (const child of $getRoot().getChildren()) {
                    if (!(child instanceof ElementNode)) continue;
                    for (const node of child.getChildren()) {
                        if (!$isTextNode(node)) continue;
                        const text = node.getTextContent();
                        const m = /((?:^|\s)-?in:)\S*$/i.exec(text);
                        if (m !== null) {
                            node.setTextContent(
                                // the capture group is mandatory in the regex,
                                // so a match guarantees it.
                                text.slice(0, m.index + m[1]!.length) +
                                    channel.id +
                                    ' ',
                            );
                            return;
                        }
                    }
                }
            });
            editor.focus();
        },
        [editor],
    );

    const selectUserSuggestion = useCallback(
        (member: ServerMember) => {
            editor.update(() => {
                for (const child of $getRoot().getChildren()) {
                    if (!(child instanceof ElementNode)) continue;
                    for (const node of child.getChildren()) {
                        if (!$isTextNode(node)) continue;
                        const text = node.getTextContent();
                        const m = /((?:^|\s)-?(?:from|mentions):)\S*$/i.exec(
                            text,
                        );
                        if (m !== null) {
                            node.setTextContent(
                                // the capture group is mandatory in the regex,
                                // so a match guarantees it.
                                text.slice(0, m.index + m[1]!.length) +
                                    member.user.username +
                                    ' ',
                            );
                            return;
                        }
                    }
                }
            });
            editor.focus();
        },
        [editor],
    );

    const selectDateSuggestion = useCallback(
        (value: string) => {
            editor.update(() => {
                for (const child of $getRoot().getChildren()) {
                    if (!(child instanceof ElementNode)) continue;
                    for (const node of child.getChildren()) {
                        if (!$isTextNode(node)) continue;
                        const text = node.getTextContent();
                        const m = /((?:^|\s)(?:before|after):)\S*$/i.exec(text);
                        if (m !== null) {
                            node.setTextContent(
                                // the capture group is mandatory in the regex,
                                // so a match guarantees it.
                                text.slice(0, m.index + m[1]!.length) +
                                    value +
                                    ' ',
                            );
                            return;
                        }
                    }
                }
            });
            editor.focus();
        },
        [editor],
    );

    const selectCategorySuggestion = useCallback(
        (category: Category) => {
            editor.update(() => {
                for (const child of $getRoot().getChildren()) {
                    if (!(child instanceof ElementNode)) continue;
                    for (const node of child.getChildren()) {
                        if (!$isTextNode(node)) continue;
                        const text = node.getTextContent();
                        const m = /((?:^|\s)-?inc:)\S*$/i.exec(text);
                        if (m !== null) {
                            node.setTextContent(
                                // the capture group is mandatory in the regex,
                                // so a match guarantees it.
                                text.slice(0, m.index + m[1]!.length) +
                                    category.id +
                                    ' ',
                            );
                            return;
                        }
                    }
                }
            });
            editor.focus();
        },
        [editor],
    );

    if (
        suggestions.length === 0 &&
        categorySuggestions.length === 0 &&
        userSuggestions.length === 0 &&
        !showDatePicker
    )
        return null;

    return (
        <SearchSuggestionsDropdown
            categorySuggestions={categorySuggestions}
            showDatePicker={showDatePicker}
            suggestions={suggestions}
            userSuggestions={userSuggestions}
            onSelectCategory={selectCategorySuggestion}
            onSelectDate={selectDateSuggestion}
            onSelectSuggestion={selectSuggestion}
            onSelectUser={selectUserSuggestion}
        />
    );
}
