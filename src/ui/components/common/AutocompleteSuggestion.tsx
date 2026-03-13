import React from 'react';

import { Hash, Volume2 } from 'lucide-react';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Channel, Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';
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
    | 'everyone'
    | 'channel';

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

export interface ChannelSuggestion {
    type: 'channel';
    channel: Channel;
}

export type Suggestion =
    | UserSuggestion
    | RoleSuggestion
    | EmojiSuggestion
    | ServerEmojiSuggestion
    | EveryoneSuggestion
    | ChannelSuggestion;

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
        <Box className="absolute right-0 bottom-full left-0 z-[var(--z-index-popover)] mx-4 mb-2 overflow-hidden rounded-lg border border-border-subtle bg-background shadow-lg backdrop-blur-md">
            <Box className="scrollbar-thin max-h-72 overflow-y-auto p-1">
                {suggestions.map((suggestion, index) => (
                    <Box
                        className={`
                            flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-colors
                            ${index === selectedIndex ? 'text-primary-foreground bg-primary/15' : 'hover:bg-white/5'}
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
                                <Box className="flex min-w-0 flex-col">
                                    <span
                                        className={cn(
                                            'truncate text-sm font-bold',
                                            index === selectedIndex
                                                ? 'text-primary'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {suggestion.user.displayName ||
                                            suggestion.user.username}
                                    </span>
                                    {suggestion.user.displayName && (
                                        <span className="truncate text-xs text-muted-foreground">
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
                                    className="h-4 w-4 shrink-0 rounded-full border border-white/10"
                                    style={getRoleStyle(suggestion.role)}
                                />
                                <span
                                    className={cn(
                                        'truncate text-sm font-bold',
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
                                <Box className="h-6 w-6 shrink-0">
                                    <div
                                        style={getSpriteStyle(suggestion.emoji)}
                                    />
                                </Box>
                                <span
                                    className={cn(
                                        'truncate text-sm font-bold',
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
                                <Box className="h-6 w-6 shrink-0">
                                    <img
                                        alt={suggestion.emoji.name}
                                        className="h-full w-full object-contain"
                                        src={
                                            resolveApiUrl(
                                                suggestion.emoji.imageUrl,
                                            ) || ''
                                        }
                                    />
                                </Box>
                                <span
                                    className={cn(
                                        'truncate text-sm font-bold',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    :{suggestion.emoji.name}:
                                </span>
                            </>
                        )}
                        {suggestion.type === 'channel' && (
                            <>
                                <Box className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
                                    {(() => {
                                        const CustomIcon = suggestion.channel
                                            .icon
                                            ? ICON_MAP[suggestion.channel.icon]
                                            : null;
                                        const Icon =
                                            CustomIcon ||
                                            (suggestion.channel.type === 'voice'
                                                ? Volume2
                                                : Hash);
                                        return <Icon size={16} />;
                                    })()}
                                </Box>
                                <span
                                    className={cn(
                                        'truncate text-sm font-bold',
                                        index === selectedIndex
                                            ? 'text-primary'
                                            : 'text-foreground',
                                    )}
                                >
                                    {suggestion.channel.name}
                                </span>
                            </>
                        )}
                        {suggestion.type === 'everyone' && (
                            <>
                                <Box className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                                    <span className="text-[10px] font-bold text-white">
                                        @
                                    </span>
                                </Box>
                                <span
                                    className={cn(
                                        'truncate text-sm font-bold',
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
        case 'channel':
            return `channel-${suggestion.channel._id}`;
    }
};
