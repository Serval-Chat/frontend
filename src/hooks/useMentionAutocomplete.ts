import { useMemo, useState } from 'react';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { Suggestion } from '@/ui/components/common/AutocompleteSuggestion';
import { getUnicode, groupedEmojis } from '@/utils/emoji';
import type { EmojiData } from '@/utils/emoji';

interface UseMentionAutocompleteProps {
    value: string;
    cursorPosition: number;
    members?: ServerMember[];
    roles?: Role[];
    friends?: User[];
    serverEmojis?: Emoji[];
}

interface UseMentionAutocompleteReturn {
    suggestions: Suggestion[];
    selectedIndex: number;
    hasSuggestions: boolean;
    selectSuggestion: (suggestion: Suggestion) => string;
    moveSelection: (direction: 'up' | 'down') => void;
    selectCurrent: () => string | null;
}

export const useMentionAutocomplete = ({
    value,
    cursorPosition,
    members = [],
    roles = [],
    friends = [],
    serverEmojis = [],
}: UseMentionAutocompleteProps): UseMentionAutocompleteReturn => {
    const allEmojis = useMemo(() => {
        const emojis: EmojiData[] = [];
        Object.values(groupedEmojis).forEach((categoryEmojis) => {
            emojis.push(...categoryEmojis);
        });
        return emojis;
    }, []);

    const [selection, setSelection] = useState({ queryKey: '', index: 0 });

    const autocompleteData = useMemo(() => {
        const textBeforeCursor = value.slice(0, cursorPosition);

        // check for @mention (user or role)
        const atMatch = textBeforeCursor.match(/@(\w*)$/);
        if (atMatch) {
            const query = atMatch[1].toLowerCase();
            const replaceStart = cursorPosition - atMatch[0].length;

            // filter users from members and friends
            const userSuggestions: Suggestion[] = [];

            // add server members
            members.forEach((member) => {
                const username = member.user.username.toLowerCase();
                const displayName =
                    member.user.displayName?.toLowerCase() || '';
                if (username.includes(query) || displayName.includes(query)) {
                    userSuggestions.push({ type: 'user', user: member.user });
                }
            });

            // add friends (if not in server context)
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

            // filter roles
            // note: i shouldnt have create default everyone role bro
            // now i suffer
            // next backend update will fix it
            // promise
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

            return {
                suggestions: allSuggestions.slice(0, 10),
                triggerText: query,
                triggerType: 'user' as const,
                replaceStart,
                replaceEnd: cursorPosition,
            };
        }

        // Check for :emoji:
        const emojiMatch = textBeforeCursor.match(/:(\w*)$/);
        if (emojiMatch) {
            const query = emojiMatch[1].toLowerCase();
            const replaceStart = cursorPosition - emojiMatch[0].length;

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

            return {
                suggestions: [
                    ...serverEmojiSuggestions,
                    ...emojiSuggestions,
                ].slice(0, 10),
                triggerText: query,
                triggerType: 'emoji' as const,
                replaceStart,
                replaceEnd: cursorPosition,
            };
        }

        return {
            suggestions: [] as Suggestion[],
            triggerText: '',
            triggerType: null,
            replaceStart: 0,
            replaceEnd: 0,
        };
    }, [
        value,
        cursorPosition,
        members,
        roles,
        friends,
        allEmojis,
        serverEmojis,
    ]);

    // derive current index based on whether we are still in same query
    const currentQueryKey = `${autocompleteData.triggerType}:${autocompleteData.triggerText}`;
    const selectedIndex =
        selection.queryKey === currentQueryKey ? selection.index : 0;

    const selectSuggestion = (suggestion: Suggestion): string => {
        let replacement = '';

        if (suggestion.type === 'user') {
            replacement = `<userid:'${suggestion.user._id}'> `;
        } else if (suggestion.type === 'role') {
            replacement = `<roleid:'${suggestion.role._id}'> `;
        } else if (suggestion.type === 'emoji') {
            replacement = getUnicode(suggestion.emoji);
        } else if (suggestion.type === 'server-emoji') {
            replacement = `<emoji:${suggestion.emoji._id}> `;
        } else if (suggestion.type === 'everyone') {
            replacement = '<everyone> ';
        }

        const before = value.slice(0, autocompleteData.replaceStart);
        const after = value.slice(autocompleteData.replaceEnd);

        return before + replacement + after;
    };

    const moveSelection = (direction: 'up' | 'down'): void => {
        if (autocompleteData.suggestions.length === 0) return;

        setSelection((prev) => {
            const currentIdx =
                prev.queryKey === currentQueryKey ? prev.index : 0;
            let nextIndex;
            if (direction === 'up') {
                nextIndex =
                    currentIdx > 0
                        ? currentIdx - 1
                        : autocompleteData.suggestions.length - 1;
            } else {
                nextIndex =
                    currentIdx < autocompleteData.suggestions.length - 1
                        ? currentIdx + 1
                        : 0;
            }
            return { queryKey: currentQueryKey, index: nextIndex };
        });
    };

    const selectCurrent = (): string | null => {
        if (autocompleteData.suggestions.length === 0) return null;
        return selectSuggestion(autocompleteData.suggestions[selectedIndex]);
    };

    return {
        suggestions: autocompleteData.suggestions,
        selectedIndex,
        hasSuggestions: autocompleteData.suggestions.length > 0,
        selectSuggestion,
        moveSelection,
        selectCurrent,
    };
};
