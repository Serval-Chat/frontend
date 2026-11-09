import { type CSSProperties } from 'react';

import { FolderOpen, Hash } from 'lucide-react';

import type {
    Category,
    Channel,
    ServerMember,
} from '@/api/servers/servers.types';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { colors, radius } from '@/ui/theme';

import { DateTimePicker } from './SearchDateTimePicker';

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

export function SearchSuggestionsDropdown({
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
                <Pressable
                    key={c.id}
                    style={itemStyle}
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
                </Pressable>
            ))}
            {categorySuggestions.map((c) => (
                <Pressable
                    key={c.id}
                    style={itemStyle}
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
                </Pressable>
            ))}
            {userSuggestions.map((m) => (
                <Pressable
                    key={m.userId}
                    style={itemStyle}
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
                    <Text style={{ fontWeight: 500 }}>
                        {m.nickname ?? m.user.displayName ?? m.user.username}
                    </Text>
                    {m.nickname || m.user.displayName ? (
                        <Text
                            style={{
                                color: colors.mutedForeground,
                                fontSize: '0.75rem',
                            }}
                        >
                            @{m.user.username}
                        </Text>
                    ) : null}
                </Pressable>
            ))}
            {showDatePicker ? (
                <DateTimePicker onConfirm={onSelectDate} />
            ) : null}
        </div>
    );
}
