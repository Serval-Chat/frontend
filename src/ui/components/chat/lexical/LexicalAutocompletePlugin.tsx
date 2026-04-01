import React, { useCallback, useMemo, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $getSelection, $isRangeSelection, TextNode } from 'lexical';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Channel, Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { $createChipNode } from '@/ui/components/chat/lexical/ChipNode';
import {
    AutocompleteSuggestion,
    type Suggestion,
} from '@/ui/components/common/AutocompleteSuggestion';
import { getUnicode, groupedEmojis } from '@/utils/emoji';
import type { EmojiData } from '@/utils/emoji';

interface LexicalAutocompletePluginProps {
    members?: ServerMember[];
    roles?: Role[];
    friends?: User[];
    serverEmojis?: Emoji[];
    channels?: Channel[];
    onOpenChange?: (isOpen: boolean) => void;
}

class AutocompleteOption extends MenuOption {
    suggestion: Suggestion;

    constructor(suggestion: Suggestion) {
        super(
            suggestion.type === 'everyone'
                ? 'everyone'
                : suggestion.type + Math.random().toString(),
        );
        this.suggestion = suggestion;
    }
}

interface AutocompleteMenuWrapperProps {
    selectedIndex: number | null;
    setHighlightedIndex: (index: number) => void;
    options: AutocompleteOption[];
    selectOptionAndCleanUp: (option: AutocompleteOption) => void;
}

const AutocompleteMenuWrapper = ({
    selectedIndex,
    setHighlightedIndex,
    options,
    selectOptionAndCleanUp,
}: AutocompleteMenuWrapperProps): React.ReactNode => {
    React.useEffect(() => {
        if (selectedIndex === null && options.length > 0) {
            setHighlightedIndex(0);
        }
    }, [selectedIndex, options.length, setHighlightedIndex]);

    return (
        <AutocompleteSuggestion
            selectedIndex={selectedIndex ?? 0}
            suggestions={options.map((o) => o.suggestion)}
            onSelect={(suggestion) => {
                const option = options.find((o) => o.suggestion === suggestion);
                if (option) {
                    selectOptionAndCleanUp(option);
                }
            }}
        />
    );
};

export const LexicalAutocompletePlugin: React.FC<
    LexicalAutocompletePluginProps
> = ({
    members = [],
    roles = [],
    friends = [],
    serverEmojis = [],
    channels = [],
    onOpenChange,
}) => {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    const allEmojis = useMemo(() => {
        const emojis: EmojiData[] = [];
        Object.values(groupedEmojis).forEach((categoryEmojis) => {
            emojis.push(...categoryEmojis);
        });
        return emojis;
    }, []);

    const options = useMemo(() => {
        if (queryString === null) return [];

        const query = queryString.toLowerCase();

        let triggerChar = '@';
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed()) {
                const node = selection.anchor.getNode();
                if (node instanceof TextNode) {
                    const text = node.getTextContent();
                    const offset = selection.anchor.offset;
                    const textBefore = text.slice(0, offset);
                    const match = textBefore.match(/([@:#])[^@:#]*$/);
                    if (match) {
                        triggerChar = match[1];
                    }
                }
            }
        });

        if (triggerChar === '@') {
            const userSuggestions: Suggestion[] = [];
            members.forEach((member) => {
                const username = member.user.username.toLowerCase();
                const displayName =
                    member.user.displayName?.toLowerCase() || '';
                if (username.includes(query) || displayName.includes(query)) {
                    userSuggestions.push({ type: 'user', user: member.user });
                }
            });

            friends.forEach((friend) => {
                if (!friend) return;
                const username = friend.username.toLowerCase();
                const displayName = friend.displayName?.toLowerCase() || '';
                const alreadyAdded = userSuggestions.some(
                    (s) => s.type === 'user' && s.user._id === friend._id,
                );
                if (
                    !alreadyAdded &&
                    (username.includes(query) || displayName.includes(query))
                ) {
                    userSuggestions.push({ type: 'user', user: friend });
                }
            });

            const roleSuggestions: Suggestion[] = roles
                .filter((role) => {
                    const lowerName = role.name.toLowerCase();
                    return (
                        lowerName.includes(query) &&
                        lowerName !== 'everyone' &&
                        lowerName !== '@everyone'
                    );
                })
                .map((role) => ({ type: 'role', role }));

            const allSuggestions: Suggestion[] = [
                ...userSuggestions,
                ...roleSuggestions,
            ];

            if ('everyone'.startsWith(query) || query === '') {
                allSuggestions.unshift({ type: 'everyone' });
            }

            return allSuggestions
                .slice(0, 10)
                .map((s) => new AutocompleteOption(s));
        }

        if (triggerChar === ':') {
            const emojiSuggestions: Suggestion[] = allEmojis
                .filter(
                    (emoji) =>
                        emoji.short_name.includes(query) ||
                        emoji.short_names.some((name) => name.includes(query)),
                )
                .map((emoji) => ({ type: 'emoji' as const, emoji }));

            const serverEmojiSuggestions: Suggestion[] = serverEmojis
                .filter((emoji) => emoji.name.toLowerCase().includes(query))
                .map((emoji) => ({ type: 'server-emoji' as const, emoji }));

            return [...serverEmojiSuggestions, ...emojiSuggestions]
                .slice(0, 10)
                .map((s) => new AutocompleteOption(s));
        }

        if (triggerChar === '#') {
            const channelSuggestions: Suggestion[] = channels
                .filter((channel) => channel.name.toLowerCase().includes(query))
                .map((channel) => ({ type: 'channel' as const, channel }));

            return channelSuggestions
                .slice(0, 10)
                .map((s) => new AutocompleteOption(s));
        }

        return [];
    }, [
        queryString,
        members,
        friends,
        roles,
        allEmojis,
        serverEmojis,
        channels,
        editor,
    ]);

    const isOpen = queryString !== null && options.length > 0;

    React.useEffect(() => {
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    }, [isOpen, onOpenChange]);

    const matchTrigger = useCallback((text: string) => {
        const match = text.match(/(^|\s)([@:#])([^@:#\s]{0,20})$/);
        if (match !== null) {
            return {
                leadOffset: match.index! + match[1].length,
                matchingString: match[3],
                replaceableString: match[2] + match[3],
            };
        }
        return null;
    }, []);

    const onSelectOption = useCallback(
        (
            selectedOption: AutocompleteOption,
            nodeToRemove: TextNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                if (nodeToRemove) {
                    nodeToRemove.remove();
                }

                const suggestion = selectedOption.suggestion;

                if (suggestion.type === 'emoji') {
                    const unicode = getUnicode(suggestion.emoji);
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.insertNodes([
                            $createChipNode('unicode-emoji', {
                                id: unicode,
                            }),
                        ]);
                    }
                    closeMenu();
                    return;
                }

                let chipNode;
                if (suggestion.type === 'user') {
                    chipNode = $createChipNode('user', {
                        id: suggestion.user._id,
                        label:
                            suggestion.user.displayName ||
                            suggestion.user.username,
                    });
                } else if (suggestion.type === 'role') {
                    chipNode = $createChipNode('role', {
                        id: suggestion.role._id,
                        label: suggestion.role.name,
                        color: suggestion.role.color || undefined,
                    });
                } else if (suggestion.type === 'server-emoji') {
                    chipNode = $createChipNode('emoji', {
                        id: suggestion.emoji._id,
                        label: suggestion.emoji.name,
                        imageUrl: suggestion.emoji.imageUrl,
                    });
                } else if (suggestion.type === 'channel') {
                    chipNode = $createChipNode('channel', {
                        id: suggestion.channel._id,
                        label: suggestion.channel.name,
                        serverId: suggestion.channel.serverId,
                    });
                } else if (suggestion.type === 'everyone') {
                    chipNode = $createChipNode('everyone', { id: 'everyone' });
                }

                if (chipNode) {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.insertNodes([chipNode]);
                        selection.insertText(' ');
                    }
                }
                closeMenu();
            });
        },
        [editor],
    );

    return (
        <LexicalTypeaheadMenuPlugin<AutocompleteOption>
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
            ) => {
                const isOpen =
                    anchorElementRef.current != null && options.length > 0;

                if (!isOpen) {
                    return null;
                }

                return (
                    <AutocompleteMenuWrapper
                        options={options}
                        selectOptionAndCleanUp={selectOptionAndCleanUp}
                        selectedIndex={selectedIndex}
                        setHighlightedIndex={setHighlightedIndex}
                    />
                );
            }}
            options={options}
            triggerFn={matchTrigger}
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
        />
    );
};
