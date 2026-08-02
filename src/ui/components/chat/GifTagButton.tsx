import React, { useRef, useState } from 'react';

import { Check, Plus, Tag, Trash2 } from 'lucide-react';

import {
    getApiErrorMessage,
    useAddTagsToGif,
    useCreateGifTag,
    useDeleteGifTag,
    useGifTags,
    useRemoveTagsFromGif,
} from '@/api/gifTags/gifTags.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Popover } from '@/ui/components/common/Popover';
import { useToast } from '@/ui/components/common/Toast';
import { cn } from '@/utils/cn';

interface GifTagButtonProps {
    klipyId: string;
    appliedTagIds: string[];
    className?: string;
}

export const GifTagButton = ({
    klipyId,
    appliedTagIds,
    className,
}: GifTagButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { showToast } = useToast();

    const { data: tags = [] } = useGifTags({ enabled: isOpen });
    const createTag = useCreateGifTag();
    const deleteTag = useDeleteGifTag();
    const addTags = useAddTagsToGif();
    const removeTags = useRemoveTagsFromGif();

    const handleCreate = (e: React.FormEvent): void => {
        e.preventDefault();
        const name = newTagName.trim();
        if (name === '') return;

        createTag.mutate(name, {
            onSuccess: (tag): void => {
                setNewTagName('');
                addTags.mutate({ klipyId, tagIds: [tag.id] });
            },
        });
    };

    const handleToggle = (tagId: string, applied: boolean): void => {
        if (applied) {
            removeTags.mutate({ klipyId, tagIds: [tagId] });
        } else {
            addTags.mutate({ klipyId, tagIds: [tagId] });
        }
    };

    const handleDelete = (e: React.MouseEvent, tagId: string): void => {
        e.stopPropagation();
        deleteTag.mutate(tagId, {
            onError: (error): void => {
                showToast(
                    getApiErrorMessage(error, 'Failed to delete tag'),
                    'error',
                );
            },
        });
    };

    return (
        <>
            <Button
                aria-label="Manage tags"
                className={cn(
                    'h-8 w-8 rounded-full bg-black/70 p-0 text-white transition-all hover:scale-110 hover:bg-black/90 active:scale-95',
                    className,
                )}
                ref={triggerRef}
                size="sm"
                variant="ghost"
                onClick={(e): void => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen((open) => !open);
                }}
            >
                <Tag className="h-4 w-4" />
            </Button>

            <Popover
                className="w-64 p-3"
                isOpen={isOpen}
                triggerRef={triggerRef}
                onClose={(): void => {
                    setIsOpen(false);
                }}
            >
                <div className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Tags
                </div>

                <form className="flex gap-1 pb-2" onSubmit={handleCreate}>
                    <Input
                        maxLength={32}
                        placeholder="New tag..."
                        size="sm"
                        value={newTagName}
                        onChange={(e): void => {
                            setNewTagName(e.target.value);
                        }}
                    />
                    <Button
                        className="shrink-0 px-2"
                        disabled={newTagName.trim() === ''}
                        size="sm"
                        type="submit"
                        variant="ghost"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </form>

                <div className="scrollbar-thin max-h-48 space-y-0.5 overflow-y-auto">
                    {tags.length === 0 ? (
                        <div className="py-2 text-center text-xs text-muted-foreground">
                            No tags yet
                        </div>
                    ) : (
                        tags.map((tag) => {
                            const applied = appliedTagIds.includes(tag.id);
                            return (
                                <div
                                    className="group flex items-center justify-between rounded-md px-1.5 py-1 hover:bg-bg-secondary"
                                    key={tag.id}
                                >
                                    <button
                                        className="flex flex-1 items-center gap-2 truncate text-left text-xs"
                                        type="button"
                                        onClick={(): void => {
                                            handleToggle(tag.id, applied);
                                        }}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                                                applied
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-border-subtle',
                                            )}
                                        >
                                            {applied ? (
                                                <Check className="h-2.5 w-2.5" />
                                            ) : null}
                                        </span>
                                        <span className="truncate">
                                            {tag.name}
                                        </span>
                                    </button>
                                    <button
                                        aria-label={`Delete tag ${tag.name}`}
                                        className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400"
                                        type="button"
                                        onClick={(e): void => {
                                            handleDelete(e, tag.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </Popover>
        </>
    );
};
