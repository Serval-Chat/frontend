import { type MutableRefObject, useCallback, useEffect, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $createTextNode,
    $getRoot,
    $isTextNode,
    ElementNode,
    type LexicalEditor,
    TextNode,
} from 'lexical';

import type { SearchFilters } from '@/api/chat/chat.types';
import type {
    Category,
    Channel,
    ServerMember,
} from '@/api/servers/servers.types';

import {
    $createSearchFilterNode,
    $isSearchFilterNode,
} from './SearchFilterNode';
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown';
import { TOKEN_RE, makeFilterData } from './searchFilterData';

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

interface SearchFilterPluginProps {
    channels: Channel[];
    categories: Category[];
    members: ServerMember[];
    onChange: (state: { q: string; filters: SearchFilters }) => void;
    editorRef?: MutableRefObject<LexicalEditor | null>;
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
