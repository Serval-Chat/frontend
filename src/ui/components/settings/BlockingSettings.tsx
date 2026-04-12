import React, { useState } from 'react';

import {
    BellOff,
    Check,
    Edit2,
    EyeOff,
    MessageSquare,
    MicOff,
    Plus,
    Search,
    Settings2,
    Shield,
    Trash2,
    UserMinus,
    X,
} from 'lucide-react';

import {
    type BlockProfile,
    useBlockProfiles,
    useBlocks,
    useCreateBlockProfile,
    useDeleteBlockProfile,
    useRemoveBlock,
    useUpdateBlockProfile,
    useUpsertBlock,
} from '@/api/blocks/blocks.queries';
import { BlockFlags } from '@/types/blocks';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const FLAG_GROUPS = [
    {
        title: 'Chat & Interaction',
        flags: [
            {
                flag: BlockFlags.HIDE_MESSAGES,
                label: 'Hide their messages (show collapsed instead)',
                icon: EyeOff,
            },
            {
                flag: BlockFlags.HIDE_REPLIES,
                label: 'Hide messages that reply to them',
                icon: MessageSquare,
            },
            {
                flag: BlockFlags.BLOCK_REACTIONS,
                label: 'Block their reactions on your messages',
                icon: MessageSquare,
            },
            {
                flag: BlockFlags.HIDE_THEIR_REACTIONS,
                label: "Hide their reactions on others' messages",
                icon: BellOff,
            },
            {
                flag: BlockFlags.HIDE_FROM_TYPING_INDICATORS,
                label: 'Hide from typing indicators',
                icon: MessageSquare,
            },
        ],
    },
    {
        title: 'Visibility & Servers',
        flags: [
            {
                flag: BlockFlags.HIDE_FROM_MEMBER_LIST,
                label: 'Hide them from member list',
                icon: UserMinus,
            },
            {
                flag: BlockFlags.HIDE_FROM_MENTIONS,
                label: 'Hide from mention suggestions',
                icon: Search,
            },
            {
                flag: BlockFlags.HIDE_VOICE_CHANNEL,
                label: 'Hide/Mute them in voice channels',
                icon: MicOff,
            },
        ],
    },
    {
        title: 'Presence & Identity',
        flags: [
            {
                flag: BlockFlags.HIDE_MY_PRESENCE,
                label: 'Hide your presence from them',
                icon: EyeOff,
            },
            {
                flag: BlockFlags.HIDE_THEIR_PRESENCE,
                label: 'Hide their presence from you',
                icon: EyeOff,
            },
            {
                flag: BlockFlags.HIDE_BIO,
                label: 'Hide your bio/profile fields from them',
                icon: Shield,
            },
        ],
    },
];

export const BlockingSettings: React.FC = () => {
    const [view, setView] = useState<'users' | 'profiles'>('users');

    const { data: blocks, isLoading: isBlocksLoading } = useBlocks();
    const { data: profiles, isLoading: isProfilesLoading } = useBlockProfiles();

    const { mutate: upsertBlock } = useUpsertBlock();
    const { mutate: removeBlock } = useRemoveBlock();
    const { mutate: createProfile } = useCreateBlockProfile();
    const { mutate: updateProfile } = useUpdateBlockProfile();
    const { mutate: deleteProfile } = useDeleteBlockProfile();

    const [editingProfileId, setEditingProfileId] = useState<string | null>(
        null,
    );
    const [renamingProfileId, setRenamingProfileId] = useState<string | null>(
        null,
    );
    const [renameValue, setRenameValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const renameInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (renamingProfileId) {
            renameInputRef.current?.focus();
        }
    }, [renamingProfileId]);

    const handleToggleFlag = (
        profileId: string,
        currentFlags: number,
        flag: number,
    ): void => {
        const newFlags = currentFlags ^ flag;
        updateProfile({ id: profileId, data: { flags: newFlags } });
    };

    const handleCreateProfile = (): void => {
        createProfile({
            name: 'New Profile ' + (profiles?.length ? profiles.length + 1 : 1),
            flags:
                BlockFlags.BLOCK_REACTIONS |
                BlockFlags.HIDE_MESSAGES |
                BlockFlags.HIDE_MY_PRESENCE |
                BlockFlags.HIDE_THEIR_PRESENCE,
        });
    };

    const handleStartRename = (profile: BlockProfile): void => {
        setRenamingProfileId(profile.id);
        setRenameValue(profile.name);
    };

    const handleSaveRename = (profileId: string): void => {
        if (renameValue.trim()) {
            updateProfile({
                id: profileId,
                data: { name: renameValue.trim() },
            });
        }
        setRenamingProfileId(null);
    };
    const renderUsersView = (): React.JSX.Element => (
        <Box className="flex flex-col gap-6">
            <Box className="flex flex-col gap-4">
                <Box className="flex items-center justify-between">
                    <Text
                        className="tracking-wider uppercase"
                        color="muted"
                        size="xs"
                        weight="semibold"
                    >
                        Blocked Users ({blocks?.length || 0})
                    </Text>

                    <Box className="relative w-64">
                        <Search
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-white/30"
                            size={14}
                        />
                        <input
                            className="w-full rounded-md border border-white/10 bg-black/40 py-1.5 pr-3 pl-9 text-xs text-foreground transition-all outline-none placeholder:text-white/20 focus:border-primary/50 focus:bg-black/60"
                            placeholder="Search blocked users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-white/30 hover:text-white"
                                onClick={() => setSearchQuery('')}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </Box>
                </Box>

                {isBlocksLoading ? (
                    <Box className="flex justify-center p-8">
                        <LoadingSpinner />
                    </Box>
                ) : !Array.isArray(blocks) || blocks.length === 0 ? (
                    <Box className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12">
                        <Shield className="mb-4 text-white/20" size={48} />
                        <Text color="muted">
                            You haven't blocked anyone yet.
                        </Text>
                    </Box>
                ) : (
                    <Box className="grid gap-3">
                        {(() => {
                            const filtered = blocks.filter(
                                (b: { targetUsername?: string }) =>
                                    (b.targetUsername || '')
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()),
                            );

                            if (filtered.length === 0 && searchQuery) {
                                return (
                                    <Box className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.01] p-10">
                                        <Text color="muted" size="sm">
                                            No blocked users matching "
                                            {searchQuery}"
                                        </Text>
                                    </Box>
                                );
                            }

                            return filtered.map(
                                (block: {
                                    targetUserId: string;
                                    targetUsername: string;
                                    profileId: string;
                                    flags: number;
                                }) => (
                                    <Box
                                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10"
                                        key={block.targetUserId}
                                    >
                                        <UserItem userId={block.targetUserId} />
                                        <Box className="flex items-center gap-3">
                                            <select
                                                className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                                                title="Assigned Block Profile"
                                                value={block.profileId}
                                                onChange={(e) =>
                                                    upsertBlock({
                                                        targetUserId:
                                                            block.targetUserId,
                                                        profileId:
                                                            e.target.value,
                                                    })
                                                }
                                            >
                                                {profiles?.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <IconButton
                                                className="text-destructive hover:bg-destructive/10"
                                                icon={UserMinus}
                                                size="sm"
                                                title="Unblock"
                                                variant="ghost"
                                                onClick={() =>
                                                    removeBlock(
                                                        block.targetUserId,
                                                    )
                                                }
                                            />
                                        </Box>
                                    </Box>
                                ),
                            );
                        })()}
                    </Box>
                )}
            </Box>
        </Box>
    );

    const renderProfilesView = (): React.JSX.Element => (
        <Box className="flex flex-col gap-6">
            <Box className="flex items-center justify-between">
                <Text
                    className="tracking-wider uppercase"
                    color="muted"
                    size="xs"
                    weight="semibold"
                >
                    Configured Profiles ({profiles?.length || 0})
                </Text>
                <Button
                    size="sm"
                    variant="primary"
                    onClick={handleCreateProfile}
                >
                    <Plus className="mr-2" size={16} />
                    Create Profile
                </Button>
            </Box>

            {isProfilesLoading ? (
                <Box className="flex justify-center p-8">
                    <LoadingSpinner />
                </Box>
            ) : profiles?.length === 0 ? (
                <Box className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12">
                    <Shield className="mb-4 text-white/20" size={48} />
                    <Text color="muted">
                        No block profiles exist. Create one to start blocking.
                    </Text>
                </Box>
            ) : (
                <Box className="grid gap-4">
                    {profiles?.map((profile: BlockProfile) => (
                        <Box
                            className={cn(
                                'flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
                                editingProfileId === profile.id
                                    ? 'border-primary/30 bg-primary/[0.02] shadow-lg'
                                    : 'border-white/5 bg-white/[0.02] hover:border-white/10',
                            )}
                            key={profile.id}
                        >
                            <Box className="flex items-center justify-between p-3 px-4">
                                {renamingProfileId === profile.id ? (
                                    <Box className="flex items-center gap-2">
                                        <input
                                            className="rounded border border-primary/50 bg-black/40 px-2 py-1 text-sm outline-none"
                                            ref={renameInputRef}
                                            title="Rename Profile"
                                            value={renameValue}
                                            onChange={(e) =>
                                                setRenameValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    handleSaveRename(
                                                        profile.id,
                                                    );
                                                if (e.key === 'Escape')
                                                    setRenamingProfileId(null);
                                            }}
                                        />
                                        <IconButton
                                            icon={Check}
                                            size="sm"
                                            variant="primary"
                                            onClick={() =>
                                                handleSaveRename(profile.id)
                                            }
                                        />
                                        <IconButton
                                            icon={X}
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setRenamingProfileId(null)
                                            }
                                        />
                                    </Box>
                                ) : (
                                    <Box className="flex items-center gap-2">
                                        <Text weight="semibold">
                                            {profile.name}
                                        </Text>
                                        <IconButton
                                            className="opacity-50 hover:opacity-100"
                                            icon={Edit2}
                                            size="sm"
                                            title="Rename Profile"
                                            variant="ghost"
                                            onClick={() =>
                                                handleStartRename(profile)
                                            }
                                        />
                                    </Box>
                                )}

                                <Box className="flex items-center gap-1">
                                    <IconButton
                                        className={
                                            editingProfileId === profile.id
                                                ? 'bg-primary/10 text-primary'
                                                : ''
                                        }
                                        icon={Settings2}
                                        size="sm"
                                        title="Edit Profile Flags"
                                        variant="ghost"
                                        onClick={() =>
                                            setEditingProfileId(
                                                editingProfileId === profile.id
                                                    ? null
                                                    : profile.id,
                                            )
                                        }
                                    />
                                    <IconButton
                                        className="text-destructive hover:bg-destructive/10"
                                        disabled={profiles.length <= 1}
                                        icon={Trash2}
                                        size="sm"
                                        title="Delete Profile"
                                        variant="ghost"
                                        onClick={() =>
                                            deleteProfile(profile.id)
                                        }
                                    />
                                </Box>
                            </Box>

                            {editingProfileId === profile.id && (
                                <Box className="border-t border-white/5 bg-black/20 p-4">
                                    <Box className="flex flex-col">
                                        {FLAG_GROUPS.map((group, idx) => (
                                            <Box key={group.title}>
                                                <Box
                                                    className={
                                                        idx > 0
                                                            ? 'my-2'
                                                            : 'mb-2'
                                                    }
                                                >
                                                    <Text
                                                        className="tracking-widest uppercase"
                                                        color="muted"
                                                        size="xs"
                                                        weight="bold"
                                                    >
                                                        {group.title}
                                                    </Text>
                                                </Box>
                                                <Box className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    {group.flags.map(
                                                        ({
                                                            flag,
                                                            label,
                                                            icon: Icon,
                                                        }) => {
                                                            const isActive =
                                                                (profile.flags &
                                                                    flag) ===
                                                                flag;
                                                            return (
                                                                <button
                                                                    className={cn(
                                                                        'group flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200',
                                                                        isActive
                                                                            ? 'border-primary/20 bg-primary/10 text-primary'
                                                                            : 'border-transparent bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                                                                    )}
                                                                    key={flag}
                                                                    onClick={() =>
                                                                        handleToggleFlag(
                                                                            profile.id,
                                                                            profile.flags,
                                                                            flag,
                                                                        )
                                                                    }
                                                                >
                                                                    {Icon && (
                                                                        <Box
                                                                            className={cn(
                                                                                'rounded-md p-1.5 transition-colors',
                                                                                isActive
                                                                                    ? 'bg-primary/20'
                                                                                    : 'bg-white/5 group-hover:bg-white/10',
                                                                            )}
                                                                        >
                                                                            <Icon
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        </Box>
                                                                    )}
                                                                    <Text
                                                                        className="flex-1 leading-tight font-medium"
                                                                        size="sm"
                                                                    >
                                                                        {label}
                                                                    </Text>
                                                                    <Box
                                                                        className={cn(
                                                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                                                                            isActive
                                                                                ? 'border-primary bg-primary'
                                                                                : 'border-white/20',
                                                                        )}
                                                                    >
                                                                        {isActive && (
                                                                            <Box className="h-1.5 w-1.5 rounded-full bg-white" />
                                                                        )}
                                                                    </Box>
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Box className="border-destructive/20 bg-destructive/5 mt-4 rounded border p-3">
                                        <Text
                                            className="text-destructive/80 leading-relaxed"
                                            size="xs"
                                        >
                                            Modifying these flags will
                                            immediately impact all users who are
                                            currently assigned this profile.
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <Box className="flex flex-col gap-6 p-6">
            <Box className="flex flex-col gap-2">
                <Text size="xl" weight="bold">
                    Advanced Blocking
                </Text>
                <Text color="muted" size="sm">
                    Manage your blocked users and customize specific visibility
                    profiles for different people.
                </Text>
            </Box>

            <Box className="flex gap-2 border-b border-border-subtle pb-1">
                <Button
                    size="sm"
                    variant={view === 'users' ? 'primary' : 'ghost'}
                    onClick={() => setView('users')}
                >
                    Blocked Users
                </Button>
                <Button
                    size="sm"
                    variant={view === 'profiles' ? 'primary' : 'ghost'}
                    onClick={() => setView('profiles')}
                >
                    Block Profiles
                </Button>
            </Box>

            {view === 'users' ? renderUsersView() : renderProfilesView()}
        </Box>
    );
};
