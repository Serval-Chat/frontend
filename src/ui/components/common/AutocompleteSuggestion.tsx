import React from 'react';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { getSpriteStyle } from '@/utils/emoji';
import type { EmojiData } from '@/utils/emoji';
import { getRoleStyle } from '@/utils/roleColor';

export type SuggestionType =
    | 'user'
    | 'role'
    | 'emoji'
    | 'server-emoji'
    | 'everyone';

export interface UserSuggestion {
    type: 'user';
    user: User;
}

export interface RoleSuggestion {
    type: 'role';
    role: Role;
}

export interface EmojiSuggestion {
    type: 'emoji';
    emoji: EmojiData;
}

export interface ServerEmojiSuggestion {
    type: 'server-emoji';
    emoji: Emoji;
}

export interface EveryoneSuggestion {
    type: 'everyone';
}

export type Suggestion =
    | UserSuggestion
    | RoleSuggestion
    | EmojiSuggestion
    | ServerEmojiSuggestion
    | EveryoneSuggestion;

interface AutocompleteSuggestionProps {
    suggestions: Suggestion[];
    selectedIndex: number;
    onSelect: (suggestion: Suggestion) => void;
}

export const AutocompleteSuggestion: React.FC<AutocompleteSuggestionProps> = ({
    suggestions,
    selectedIndex,
    onSelect,
}) => {
    if (suggestions.length === 0) return null;

    return (
        <Box className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-background border border-border-subtle rounded-lg shadow-lg overflow-hidden z-[var(--z-popover)]">
            <Box className="p-1 max-h-72 overflow-y-auto scrollbar-thin">
                {suggestions.map((suggestion, index) => (
                    <Box
                        className={`
                            flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-colors
                            ${index === selectedIndex ? 'bg-primary/15 text-primary-foreground' : 'hover:bg-white/5'}
                        `}
                        key={getSuggestionKey(suggestion)}
                        onClick={() => onSelect(suggestion)}
                    >
                        {suggestion.type === 'user' && (
                            <>
                                <UserProfilePicture
                                    size="sm"
                                    src={suggestion.user.profilePicture}
                                    username={suggestion.user.username}
                                />
                                <Box className="flex flex-col min-w-0">
                                    <span
                                        className={cn(
                                            'font-bold truncate text-sm',
                                            index === selectedIndex
                                                ? 'text-primary'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {suggestion.user.displayName ||
                                            suggestion.user.username}
                                    </span>
                                    {suggestion.user.displayName && (
                                        <span className="text-muted-foreground text-xs truncate">
                                            {suggestion.user.username.startsWith(
                                                '@',
                                            )
                                                ? suggestion.user.username
                                                : `@${suggestion.user.username}`}
                                        </span>
                                    )}
                                </Box>
                            </>
                        )}
                        {suggestion.type === 'role' && (
                            <>
                                <Box
                                    className="w-4 h-4 rounded-full shrink-0 border border-white/10"
                                    style={getRoleStyle(suggestion.role)}
                                />
                                <span
                                    className={cn(
                                        'font-bold truncate text-sm',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    {suggestion.role.name.startsWith('@')
                                        ? suggestion.role.name
                                        : `@${suggestion.role.name}`}
                                </span>
                            </>
                        )}
                        {suggestion.type === 'emoji' && (
                            <>
                                <Box className="w-6 h-6 shrink-0">
                                    <div
                                        style={getSpriteStyle(suggestion.emoji)}
                                    />
                                </Box>
                                <span
                                    className={cn(
                                        'font-bold truncate text-sm',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    :{suggestion.emoji.short_name}:
                                </span>
                            </>
                        )}
                        {suggestion.type === 'server-emoji' && (
                            <>
                                <Box className="w-6 h-6 shrink-0">
                                    <img
                                        alt={suggestion.emoji.name}
                                        className="w-full h-full object-contain"
                                        src={
                                            resolveApiUrl(
                                                suggestion.emoji.imageUrl,
                                            ) || ''
                                        }
                                    />
                                </Box>
                                <span
                                    className={cn(
                                        'font-bold truncate text-sm',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    :{suggestion.emoji.name}:
                                </span>
                            </>
                        )}
                        {suggestion.type === 'everyone' && (
                            <>
                                <Box className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-primary">
                                    <span className="text-[10px] text-white font-bold">
                                        @
                                    </span>
                                </Box>
                                <span
                                    className={cn(
                                        'font-bold truncate text-sm',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    @everyone
                                </span>
                            </>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const getSuggestionKey = (suggestion: Suggestion): string => {
    switch (suggestion.type) {
        case 'user':
            return `user-${suggestion.user._id}`;
        case 'role':
            return `role-${suggestion.role._id}`;
        case 'emoji':
            return `emoji-${suggestion.emoji.short_name}`;
        case 'server-emoji':
            return `server-emoji-${suggestion.emoji._id}`;
        case 'everyone':
            return 'everyone';
    }
};
