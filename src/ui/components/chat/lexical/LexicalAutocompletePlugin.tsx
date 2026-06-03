import React, { useCallback, useMemo, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    TextNode,
} from 'lexical';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Channel, Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
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
    serverId?: string;
    onOpenChange?: (isOpen: boolean) => void;
}

class AutocompleteOption extends MenuOption {
    suggestion: Suggestion;

    constructor(suggestion: Suggestion) {
        let key = suggestion.type;
        if (suggestion.type === 'everyone') key += 'everyone';
        else if (suggestion.type === 'user') key += suggestion.user.id;
        else if (suggestion.type === 'role') key += suggestion.role.id;
        else if (suggestion.type === 'emoji')
            key += suggestion.emoji.short_name;
        else if (suggestion.type === 'server-emoji') key += suggestion.emoji.id;
        else if (suggestion.type === 'channel') key += suggestion.channel.id;

        super(key);
        this.suggestion = suggestion;
    }
}

interface AutocompleteMenuWrapperProps {
    anchorElementRef: React.RefObject<HTMLElement | null>;
    selectedIndex: number | null;
    setHighlightedIndex: (index: number) => void;
    options: AutocompleteOption[];
    selectOptionAndCleanUp: (option: AutocompleteOption) => void;
}

const AutocompleteMenuWrapper = ({
    anchorElementRef,
    selectedIndex,
    setHighlightedIndex,
    options,
    selectOptionAndCleanUp,
}: AutocompleteMenuWrapperProps): React.ReactNode => {
    React.useEffect((): void => {
        if (selectedIndex === null && options.length > 0) {
            setHighlightedIndex(0);
        }
    }, [selectedIndex, options.length, setHighlightedIndex]);

    return (
        <AutocompleteSuggestion
            anchorElementRef={anchorElementRef}
            selectedIndex={selectedIndex ?? 0}
            suggestions={options.map((o): Suggestion => o.suggestion)}
            onSelect={(suggestion): void => {
                const option = options.find(
                    (o): boolean => o.suggestion === suggestion,
                );
                if (option) {
                    selectOptionAndCleanUp(option);
                }
            }}
        />
    );
};

export const LexicalAutocompletePlugin = ({
    members = [],
    roles = [],
    friends = [],
    serverEmojis = [],
    channels = [],
    serverId,
    onOpenChange,
}: LexicalAutocompletePluginProps) => {
    const [editor] = useLexicalComposerContext();
    const blocks = useAppSelector(
        (state): Record<string, number> => state.blocking.blocks,
    );
    const [queryString, setQueryString] = useState<string | null>(null);

    const allEmojis = useMemo((): EmojiData[] => {
        const emojis: EmojiData[] = [];
        Object.values(groupedEmojis).forEach((categoryEmojis): void => {
            emojis.push(...categoryEmojis);
        });
        return emojis;
    }, []);

    const options = useMemo((): AutocompleteOption[] => {
        if (queryString === null || queryString.length === 0) return [];

        const triggerChar = queryString[0];
        const query = queryString.slice(1).toLowerCase();

        if (triggerChar === '@') {
            const memberPriority = new Map<string, number>();
            const userSuggestions: Suggestion[] = [];

            members.forEach((member): void => {
                const userBlocks = blocks[member.userId] || 0;
                if (userBlocks & BlockFlags.HIDE_FROM_MENTIONS) return;

                const username = member.user.username.toLowerCase();
                const displayName =
                    member.user.displayName?.toLowerCase() || '';
                const nickname = member.nickname?.toLowerCase() || '';

                const matchesUsername = username.includes(query);
                const matchesDisplayName =
                    displayName !== '' && displayName.includes(query);
                const matchesNickname =
                    nickname !== '' && nickname.includes(query);

                if (matchesUsername || matchesDisplayName || matchesNickname) {
                    const priority = matchesNickname
                        ? 0
                        : matchesDisplayName
                          ? 1
                          : 2;
                    memberPriority.set(member.user.id, priority);
                    userSuggestions.push({
                        type: 'user',
                        user: member.user,
                        nickname: member.nickname,
                    });
                }
            });

            if (members.length === 0) {
                friends.forEach((friend): void => {
                    if (!friend) return;

                    const userBlocks = blocks[friend.id] || 0;
                    if (userBlocks & BlockFlags.HIDE_FROM_MENTIONS) return;

                    const username = friend.username.toLowerCase();
                    const displayName = friend.displayName?.toLowerCase() || '';
                    const alreadyAdded = userSuggestions.some(
                        (s): boolean =>
                            s.type === 'user' && s.user.id === friend.id,
                    );
                    if (
                        !alreadyAdded &&
                        (username.includes(query) ||
                            displayName.includes(query))
                    ) {
                        const priority = displayName.includes(query) ? 0 : 1;
                        memberPriority.set(friend.id, priority);
                        userSuggestions.push({ type: 'user', user: friend });
                    }
                });
            }

            userSuggestions.sort((a, b): number => {
                const pa =
                    a.type === 'user'
                        ? (memberPriority.get(a.user.id) ?? 99)
                        : 99;
                const pb =
                    b.type === 'user'
                        ? (memberPriority.get(b.user.id) ?? 99)
                        : 99;
                return pa - pb;
            });

            const roleSuggestions: Suggestion[] = roles
                .filter((role): boolean => {
                    const lowerName = role.name.toLowerCase();
                    return (
                        lowerName.includes(query) &&
                        lowerName !== 'everyone' &&
                        lowerName !== '@everyone'
                    );
                })
                .map((role): { type: 'role'; role: Role } => ({
                    type: 'role',
                    role,
                }));

            const allSuggestions: Suggestion[] = [
                ...userSuggestions,
                ...roleSuggestions,
            ];

            if ('everyone'.startsWith(query) || query === '') {
                allSuggestions.unshift({ type: 'everyone' });
            }

            return allSuggestions
                .slice(0, 10)
                .map((s): AutocompleteOption => new AutocompleteOption(s));
        }

        if (triggerChar === ':') {
            const emojiSuggestions: Suggestion[] = allEmojis
                .filter(
                    (emoji): boolean =>
                        emoji.short_name.includes(query) ||
                        emoji.short_names.some((name): boolean =>
                            name.includes(query),
                        ),
                )
                .map((emoji): { type: 'emoji'; emoji: EmojiData } => ({
                    type: 'emoji' as const,
                    emoji,
                }));

            const serverEmojiSuggestions: Suggestion[] = serverEmojis
                .filter((emoji): boolean =>
                    emoji.name.toLowerCase().includes(query),
                )
                .map((emoji): { type: 'server-emoji'; emoji: Emoji } => ({
                    type: 'server-emoji' as const,
                    emoji,
                }));

            return [...serverEmojiSuggestions, ...emojiSuggestions]
                .slice(0, 10)
                .map((s): AutocompleteOption => new AutocompleteOption(s));
        }

        if (triggerChar === '#') {
            const channelSuggestions: Suggestion[] = channels
                .filter((channel): boolean =>
                    channel.name.toLowerCase().includes(query),
                )
                .map((channel): { type: 'channel'; channel: Channel } => ({
                    type: 'channel' as const,
                    channel,
                }));

            return channelSuggestions
                .slice(0, 10)
                .map((s): AutocompleteOption => new AutocompleteOption(s));
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
        blocks,
    ]);

    const isOpen = queryString !== null && options.length > 0;

    React.useEffect((): void => {
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    }, [isOpen, onOpenChange]);

    const matchTrigger = useCallback(
        (text: string) => {
            const completeEmojiMatch = text.match(/(^|\s):([^@#\s:]+):$/);
            if (completeEmojiMatch !== null) {
                const emojiName = completeEmojiMatch[2].toLowerCase();

                const matchingUnicodeEmojis = allEmojis.filter(
                    (emoji): boolean =>
                        emoji.short_name === emojiName ||
                        emoji.short_names.some(
                            (name): boolean => name === emojiName,
                        ),
                );

                const matchingCustomEmojis = serverEmojis.filter(
                    (emoji): boolean => emoji.name.toLowerCase() === emojiName,
                );

                const totalMatches =
                    matchingUnicodeEmojis.length + matchingCustomEmojis.length;

                if (totalMatches === 1) {
                    editor.update((): void => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            const node = selection.anchor.getNode();
                            if (node instanceof TextNode) {
                                const textContent = node.getTextContent();
                                const offset = selection.anchor.offset;

                                const beforeCursor = textContent.slice(
                                    0,
                                    offset,
                                );
                                const patternMatch =
                                    beforeCursor.match(/(^|\s):([^:\s]+):$/);

                                if (patternMatch) {
                                    const patternStart =
                                        offset - patternMatch[0].length;
                                    const beforePattern = textContent.slice(
                                        0,
                                        patternStart,
                                    );
                                    const afterPattern =
                                        textContent.slice(offset);

                                    if (matchingUnicodeEmojis.length === 1) {
                                        const unicode = getUnicode(
                                            matchingUnicodeEmojis[0],
                                        );
                                        node.setTextContent(
                                            beforePattern +
                                                unicode +
                                                afterPattern,
                                        );
                                    } else if (
                                        matchingCustomEmojis.length === 1
                                    ) {
                                        const customEmoji =
                                            matchingCustomEmojis[0];
                                        node.setTextContent(
                                            beforePattern + afterPattern,
                                        );
                                        const selection2 = $getSelection();
                                        if ($isRangeSelection(selection2)) {
                                            selection2.insertNodes([
                                                $createChipNode('emoji', {
                                                    id: customEmoji.id,
                                                    label: customEmoji.name,
                                                    imageUrl:
                                                        customEmoji.imageUrl,
                                                }),
                                            ]);
                                        }
                                    }
                                }
                            }
                        }
                    });

                    return null;
                }
            }

            const match = text.match(/(^|\s)([@:#])([^@#\s]{0,20})$/);
            if (match !== null) {
                const trigger = match[2];
                const matchingString = match[3];

                if (trigger === ':' && matchingString.length < 2) {
                    return null;
                }

                return {
                    leadOffset: match.index! + match[1].length,
                    matchingString: trigger + matchingString,
                    replaceableString: trigger + matchingString,
                };
            }
            return null;
        },
        [editor, allEmojis, serverEmojis],
    );

    const onSelectOption = useCallback(
        (
            selectedOption: AutocompleteOption,
            nodeToRemove: TextNode | null,
            closeMenu: () => void,
        ): void => {
            editor.update((): void => {
                const suggestion = selectedOption.suggestion;

                if (suggestion.type === 'emoji') {
                    if (nodeToRemove) {
                        nodeToRemove.remove();
                    }
                    const unicode = getUnicode(suggestion.emoji);
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.insertNodes([
                            $createChipNode('unicode-emoji', {
                                id: unicode,
                            }),
                        ]);
                        selection.insertText(' ');
                    }
                    closeMenu();
                    return;
                }

                let chipNode;
                if (suggestion.type === 'user') {
                    chipNode = $createChipNode('user', {
                        id: suggestion.user.id,
                        label:
                            suggestion.nickname ||
                            suggestion.user.displayName ||
                            suggestion.user.username,
                        serverId,
                    });
                } else if (suggestion.type === 'role') {
                    chipNode = $createChipNode('role', {
                        id: suggestion.role.id,
                        label: suggestion.role.name,
                        color: suggestion.role.color || undefined,
                    });
                } else if (suggestion.type === 'server-emoji') {
                    chipNode = $createChipNode('emoji', {
                        id: suggestion.emoji.id,
                        label: suggestion.emoji.name,
                        imageUrl: suggestion.emoji.imageUrl,
                    });
                } else if (suggestion.type === 'channel') {
                    chipNode = $createChipNode('channel', {
                        id: suggestion.channel.id,
                        label: suggestion.channel.name,
                        serverId: suggestion.channel.serverId,
                    });
                } else if (suggestion.type === 'everyone') {
                    chipNode = $createChipNode('everyone', { id: 'everyone' });
                }

                if (chipNode) {
                    if (nodeToRemove) {
                        nodeToRemove.replace(chipNode);
                    } else {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            selection.insertNodes([chipNode]);
                        }
                    }
                    chipNode.insertAfter($createTextNode(' '));
                }
                closeMenu();
            });
        },
        [editor, serverId],
    );

    return (
        <LexicalTypeaheadMenuPlugin<AutocompleteOption>
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
            ) => {
                const isOpen = options.length > 0;

                if (!isOpen) {
                    return null;
                }

                return (
                    <AutocompleteMenuWrapper
                        anchorElementRef={anchorElementRef}
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
