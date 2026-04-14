import { type ReactNode, useState } from 'react';

import {
    ChevronDown,
    Clock,
    Edit2,
    History,
    MessageSquare,
    Plus,
    StickyNote,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';

import {
    useAdminNotes,
    useCreateAdminNote,
    useDeleteAdminNote,
    useUpdateAdminNote,
} from '@/hooks/admin/useAdminNotes';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { useToast } from '@/ui/components/common/Toast';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { cn } from '@/utils/cn';

interface AdminNotesSectionProps {
    targetId: string;
    targetType: 'Server' | 'User';
}

export const AdminNotesSection = ({
    targetId,
    targetType,
}: AdminNotesSectionProps): ReactNode => {
    const { data: notes, isLoading } = useAdminNotes(targetId, targetType);
    const { mutate: createNote, isPending: isCreating } = useCreateAdminNote();
    const { mutate: updateNote, isPending: isUpdating } = useUpdateAdminNote();
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteAdminNote();
    const { showToast } = useToast();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [noteContent, setNoteContent] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(
        new Set(),
    );

    const toggleHistory = (noteId: string): void => {
        const next = new Set(expandedHistoryIds);
        if (next.has(noteId)) {
            next.delete(noteId);
        } else {
            next.add(noteId);
        }
        setExpandedHistoryIds(next);
    };

    const handleAddNote = (): void => {
        if (!noteContent.trim()) return;
        createNote(
            { targetId, targetType, content: noteContent },
            {
                onSuccess: () => {
                    showToast('Note added', 'success');
                    setIsAddModalOpen(false);
                    setNoteContent('');
                },
                onError: (e) => showToast(e.message, 'error'),
            },
        );
    };

    const handleUpdateNote = (): void => {
        if (!activeNoteId || !noteContent.trim()) return;
        updateNote(
            { noteId: activeNoteId, content: noteContent },
            {
                onSuccess: () => {
                    showToast('Note updated', 'success');
                    setIsEditModalOpen(false);
                    setNoteContent('');
                    setActiveNoteId(null);
                },
                onError: (e) => showToast(e.message, 'error'),
            },
        );
    };

    const handleDeleteNote = (): void => {
        if (!activeNoteId || !deleteReason.trim()) return;
        deleteNote(
            { noteId: activeNoteId, reason: deleteReason },
            {
                onSuccess: () => {
                    showToast('Note deleted', 'success');
                    setIsDeleteModalOpen(false);
                    setDeleteReason('');
                    setActiveNoteId(null);
                },
                onError: (e) => showToast(e.message, 'error'),
            },
        );
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 rounded bg-bg-secondary" />
                <div className="h-24 w-full rounded bg-bg-secondary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <StickyNote className="text-primary" size={18} />
                    <Heading level={3} variant="admin-sub">
                        Administrative Notes ({notes?.length || 0})
                    </Heading>
                </div>
                <Button
                    size="sm"
                    variant="normal"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="mr-2" size={14} />
                    Add Note
                </Button>
            </div>

            <div className="space-y-4">
                {!notes || notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle py-10 text-muted-foreground">
                        <MessageSquare className="mb-2 opacity-20" size={32} />
                        <Text variant="muted">No internal notes yet.</Text>
                    </div>
                ) : (
                    notes.map((note) => {
                        const isDeleted = !!note.deletedAt;
                        return (
                            <div
                                className={cn(
                                    'group relative rounded-2xl border p-4 transition-all',
                                    isDeleted
                                        ? 'border-border-subtle bg-bg-secondary/30 opacity-80 grayscale-[0.5]'
                                        : 'border-border-subtle bg-bg-subtle hover:border-primary/30',
                                )}
                                key={note._id}
                            >
                                <div className="mb-3 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <UserProfilePicture
                                            size="sm"
                                            src={
                                                note.adminId.profilePicture ||
                                                undefined
                                            }
                                            username={note.adminId.username}
                                        />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Text size="sm" weight="bold">
                                                    {note.adminId.displayName ||
                                                        note.adminId.username}
                                                </Text>
                                                {isDeleted && (
                                                    <div className="flex items-center gap-1 rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold tracking-tight text-danger uppercase">
                                                        <XCircle size={10} />
                                                        Deleted
                                                    </div>
                                                )}
                                                {note.history.length > 0 &&
                                                    !isDeleted && (
                                                        <button
                                                            className="bg-info/10 text-info hover:bg-info/20 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight uppercase transition-colors"
                                                            onClick={() =>
                                                                toggleHistory(
                                                                    note._id,
                                                                )
                                                            }
                                                        >
                                                            <History
                                                                size={10}
                                                            />
                                                            Edited
                                                            <ChevronDown
                                                                className={cn(
                                                                    'transition-transform',
                                                                    expandedHistoryIds.has(
                                                                        note._id,
                                                                    ) &&
                                                                        'rotate-180',
                                                                )}
                                                                size={10}
                                                            />
                                                        </button>
                                                    )}
                                            </div>
                                            <Text size="xs" variant="muted">
                                                {new Date(
                                                    note.createdAt,
                                                ).toLocaleString()}
                                            </Text>
                                        </div>
                                    </div>

                                    {!isDeleted && (
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setActiveNoteId(note._id);
                                                    setNoteContent(
                                                        note.content,
                                                    );
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <Edit2 size={12} />
                                            </Button>
                                            <Button
                                                className="text-danger hover:bg-danger/10 hover:text-danger"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setActiveNoteId(note._id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-sm prose-invert max-w-none">
                                    <Text className="leading-relaxed whitespace-pre-wrap">
                                        {note.content}
                                    </Text>
                                </div>

                                {expandedHistoryIds.has(note._id) &&
                                    note.history.length > 0 && (
                                        <div className="border-info/20 bg-info/5 animate-in fade-in slide-in-from-top-2 mt-4 space-y-3 rounded-xl border p-3 duration-200">
                                            <div className="text-info flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                                                <History size={12} />
                                                Note Revision History
                                            </div>
                                            <div className="space-y-4">
                                                {note.history
                                                    .slice()
                                                    .reverse()
                                                    .map((history) => (
                                                        <div
                                                            className="border-info/20 relative border-l-2 py-1 pl-4"
                                                            key={history.editedAt.toString()}
                                                        >
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <UserProfilePicture
                                                                        size="xs"
                                                                        src={
                                                                            history
                                                                                .editorId
                                                                                .profilePicture ||
                                                                            undefined
                                                                        }
                                                                        username={
                                                                            history
                                                                                .editorId
                                                                                .username
                                                                        }
                                                                    />
                                                                    <Text
                                                                        size="xs"
                                                                        weight="bold"
                                                                    >
                                                                        {history
                                                                            .editorId
                                                                            .displayName ||
                                                                            history
                                                                                .editorId
                                                                                .username}
                                                                    </Text>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Clock
                                                                        size={
                                                                            10
                                                                        }
                                                                    />
                                                                    <Text size="xs">
                                                                        {new Date(
                                                                            history.editedAt,
                                                                        ).toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                            <Text
                                                                className="whitespace-pre-wrap text-muted-foreground italic"
                                                                size="xs"
                                                            >
                                                                {
                                                                    history.content
                                                                }
                                                            </Text>
                                                        </div>
                                                    ))}
                                                <div className="border-info/20 relative border-l-2 py-1 pl-4">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 opacity-50">
                                                            <User size={12} />
                                                            <Text
                                                                size="xs"
                                                                weight="bold"
                                                            >
                                                                Original Creator
                                                            </Text>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-muted-foreground opacity-50">
                                                            <Clock size={10} />
                                                            <Text size="xs">
                                                                {new Date(
                                                                    note.createdAt,
                                                                ).toLocaleString()}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {isDeleted && (
                                    <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3">
                                        <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-widest text-danger uppercase">
                                            <span>Deletion Record</span>
                                            <span>
                                                {new Date(
                                                    note.deletedAt!,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Text
                                            className="text-danger/80 italic"
                                            size="xs"
                                        >
                                            Reason: {note.deleteReason}
                                        </Text>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <Text size="xs" variant="muted">
                                                Removed by
                                            </Text>
                                            <UserProfilePicture
                                                size="xs"
                                                src={
                                                    note.deletedBy
                                                        ?.profilePicture ||
                                                    undefined
                                                }
                                                username={
                                                    note.deletedBy?.username ||
                                                    'Unknown'
                                                }
                                            />
                                            <Text size="xs" weight="bold">
                                                {note.deletedBy?.displayName ||
                                                    note.deletedBy?.username ||
                                                    'System'}
                                            </Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                title="Add Administrative Note"
                onClose={() => {
                    setIsAddModalOpen(false);
                    setNoteContent('');
                }}
            >
                <div className="space-y-4 p-6">
                    <TextArea
                        placeholder="Write notes here"
                        rows={5}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!noteContent.trim() || isCreating}
                            onClick={handleAddNote}
                        >
                            {isCreating ? 'Adding...' : 'Add Note'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                title="Edit Note"
                onClose={() => {
                    setIsEditModalOpen(false);
                    setNoteContent('');
                    setActiveNoteId(null);
                }}
            >
                <div className="space-y-4 p-6">
                    <TextArea
                        placeholder="Update your signalling..."
                        rows={5}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!noteContent.trim() || isUpdating}
                            onClick={handleUpdateNote}
                        >
                            {isUpdating ? 'Update' : 'Update Note'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                title="Delete Admin Note"
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteReason('');
                    setActiveNoteId(null);
                }}
            >
                <div className="space-y-4 p-6">
                    <div className="rounded-xl bg-danger/10 p-4 text-center text-danger">
                        <Text size="sm" weight="bold">
                            Warning: Accountability Required
                        </Text>
                        <Text size="xs">
                            This will not permanently remove the note. It will
                            be archived with your reason for other admins to
                            verify.
                        </Text>
                    </div>
                    <TextArea
                        placeholder="Reason for deletion is REQUIRED..."
                        rows={3}
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-danger text-white hover:bg-danger/90"
                            disabled={!deleteReason.trim() || isDeleting}
                            onClick={handleDeleteNote}
                        >
                            {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
