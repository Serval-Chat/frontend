import { useReducer, useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Share2, Sparkles, Trash2, Upload } from 'lucide-react';

import { decorationsApi, getDecorationUrl } from '@/api/decorations';
import { useMe } from '@/api/users/users.queries';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { useToast } from '@/ui/components/common/Toast';
import { cn } from '@/utils/cn';
import { mergeReducer } from '@/utils/mergeReducer';

interface DecorationUser {
    profilePicture?: string | null;
    username?: string;
    decorationId?: string | null;
}

const DecorationCollection = ({
    decorations,
    user,
    isLoading,
    isDeleting,
    onApply,
    onRequestDelete,
}: {
    decorations: { id: string; name: string }[];
    user: DecorationUser;
    isLoading: boolean;
    isDeleting: boolean;
    onApply: (id: string) => void;
    onRequestDelete: (deco: { id: string; name: string }) => void;
}) => (
    <section className="space-y-4">
        <Heading level={4}>My Collection</Heading>
        <div className="rounded-xl border border-border-subtle bg-bg-subtle p-6">
            {isLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    Loading decorations...
                </div>
            ) : decorations.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    You haven't uploaded any decorations yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {decorations.map((deco) => {
                        const isActive = user.decorationId === deco.id;
                        return (
                            <div
                                className={cn(
                                    'group relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-colors',
                                    isActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border-subtle bg-bg-secondary hover:border-primary/50',
                                )}
                                key={deco.id}
                            >
                                <button
                                    className="flex w-full cursor-pointer flex-col items-center gap-3 border-0 bg-transparent p-0 text-left"
                                    type="button"
                                    onClick={() => {
                                        if (!isActive) onApply(deco.id);
                                    }}
                                >
                                    <div className="relative h-16 w-16 shrink-0">
                                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-subtle">
                                            {user.profilePicture ? (
                                                <img
                                                    alt=""
                                                    className="h-full w-full object-cover opacity-50"
                                                    src={user.profilePicture}
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-muted-foreground opacity-50">
                                                    {user.username?.[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="pointer-events-none absolute inset-0 z-10 scale-125"
                                            style={{
                                                backgroundImage: `url(${getDecorationUrl(deco.id, 64)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                    </div>
                                    <div
                                        className="w-full truncate px-1 text-center text-sm font-medium"
                                        title={deco.name}
                                    >
                                        {deco.name}
                                    </div>
                                    {isActive ? (
                                        <div className="text-primary-foreground absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase">
                                            Active
                                        </div>
                                    ) : null}
                                </button>
                                <button
                                    className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground absolute top-2 right-2 rounded-md p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                                    disabled={isDeleting}
                                    title="Delete Decoration"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRequestDelete({
                                            id: deco.id,
                                            name: deco.name,
                                        });
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </section>
);

const DecorationUploadSection = ({
    name,
    selectedFile,
    previewUrl,
    fileInputRef,
    isUploading,
    onNameChange,
    onFileChange,
    onUpload,
}: {
    name: string;
    selectedFile: File | null;
    previewUrl: string | null;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isUploading: boolean;
    onNameChange: (name: string) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
}) => (
    <section className="space-y-4">
        <Heading level={4}>Upload New Decoration</Heading>
        <div className="space-y-5 rounded-xl border border-border-subtle bg-bg-subtle p-6">
            <div className="space-y-1.5">
                <label
                    className="text-xs font-bold text-muted-foreground uppercase"
                    htmlFor="decoration-name"
                >
                    Decoration Name
                </label>
                <input
                    className="w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    id="decoration-name"
                    maxLength={64}
                    placeholder="e.g. Golden Crown"
                    type="text"
                    value={name}
                    onChange={(e) => {
                        onNameChange(e.target.value);
                    }}
                />
            </div>

            <div className="space-y-1.5">
                <label
                    className="text-xs font-bold text-muted-foreground uppercase"
                    htmlFor="decoration-file"
                >
                    Image (WebP or GIF; PNG/JPEG auto-converted)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        accept="image/webp,image/gif,image/png,image/jpeg"
                        aria-label="Upload decoration image"
                        className="hidden"
                        id="decoration-file"
                        ref={fileInputRef}
                        type="file"
                        onChange={onFileChange}
                    />
                    <Button
                        icon={Upload}
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Choose File
                    </Button>
                    {selectedFile ? (
                        <span className="max-w-xs truncate text-sm text-muted-foreground">
                            {selectedFile.name}{' '}
                            <span className="text-xs opacity-60">
                                ({(selectedFile.size / 1024).toFixed(1)} kB)
                            </span>
                        </span>
                    ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                    Max 800 kB. Between 64x64 and 512x512 px. Transparent PNG
                    will be preserved.
                </p>
            </div>

            {previewUrl ? (
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary">
                    <img
                        alt="Decoration preview"
                        className="max-h-full object-contain"
                        src={previewUrl}
                    />
                </div>
            ) : null}

            <div className="flex justify-end pt-2">
                <Button
                    disabled={
                        name.trim() === '' || !selectedFile || isUploading
                    }
                    size="sm"
                    variant="primary"
                    onClick={onUpload}
                >
                    {isUploading ? 'Uploading...' : 'Upload & Apply'}
                </Button>
            </div>
        </div>
    </section>
);

const MAX_FILE_SIZE = 800 * 1024;

const processFileToWebp = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
        if (file.type === 'image/webp' || file.type === 'image/gif') {
            resolve(file);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.addEventListener('load', () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(objectUrl);
                    if (blob) {
                        resolve(
                            new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, '.webp'),
                                { type: 'image/webp' },
                            ),
                        );
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/webp',
                0.92,
            );
        });
        img.addEventListener('error', () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        });
        img.src = objectUrl;
    });

export const AvatarDecorationsSettings = () => {
    const { data: user } = useMe();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const limitedAnimations = useLimitedAnimations();
    const fileInputRef = useRef<HTMLInputElement>(null);

    interface DecoState {
        name: string;
        selectedFile: File | null;
        previewUrl: string | null;
        isHovered: boolean;
        decorationToDelete: { id: string; name: string } | null;
    }
    const [deco, patchDeco] = useReducer(mergeReducer<DecoState>, {
        name: '',
        selectedFile: null,
        previewUrl: null,
        isHovered: false,
        decorationToDelete: null,
    });
    const { name, selectedFile, previewUrl, isHovered, decorationToDelete } =
        deco;
    const setName = (v: string): void => {
        patchDeco({ name: v });
    };
    const setSelectedFile = (v: File | null): void => {
        patchDeco({ selectedFile: v });
    };
    const setPreviewUrl = (v: string | null): void => {
        patchDeco({ previewUrl: v });
    };
    const setIsHovered = (v: boolean): void => {
        patchDeco({ isHovered: v });
    };
    const setDecorationToDelete = (
        v: { id: string; name: string } | null,
    ): void => {
        patchDeco({ decorationToDelete: v });
    };

    const { data: myDecorationsResponse, isLoading: isLoadingDecorations } =
        useQuery({
            queryKey: ['my-decorations'],
            queryFn: () => decorationsApi.getMyDecorations(),
        });
    const myDecorations = myDecorationsResponse?.decorations ?? [];

    const uploadMutation = useMutation({
        mutationFn: async ({ name, file }: { name: string; file: File }) =>
            decorationsApi.upload(name, file),
        onSuccess: (data) => {
            showToast('Decoration uploaded!', 'success');
            setName('');
            setSelectedFile(null);
            setPreviewUrl(null);
            void queryClient.invalidateQueries({
                queryKey: ['my-decorations'],
            });
            applyMutation.mutate(data.decoration.id);
        },
        onError: () => {
            showToast('Failed to upload decoration.', 'error');
        },
    });

    const applyMutation = useMutation({
        mutationFn: decorationsApi.apply,
        onSuccess: () => {
            showToast('Decoration applied!', 'success');
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
        onError: () => {
            showToast('Failed to apply decoration.', 'error');
        },
    });

    const removeMutation = useMutation({
        mutationFn: decorationsApi.removeActive,
        onSuccess: () => {
            showToast('Decoration removed.', 'success');
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
        onError: () => {
            showToast('Failed to remove decoration.', 'error');
        },
    });

    const deleteDecorationMutation = useMutation({
        mutationFn: decorationsApi.deleteDecoration,
        onSuccess: () => {
            showToast('Decoration deleted.', 'success');
            void queryClient.invalidateQueries({
                queryKey: ['my-decorations'],
            });
            void queryClient.invalidateQueries({ queryKey: ['me'] });
            setDecorationToDelete(null);
        },
        onError: () => {
            showToast('Failed to delete decoration.', 'error');
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const file = target.files?.[0];
        target.value = '';
        if (!file) return;

        try {
            const processed = await processFileToWebp(file);
            if (processed.size > MAX_FILE_SIZE) {
                showToast(
                    `File too large after conversion: ${(processed.size / 1024).toFixed(1)} kB. Max is 800 kB.`,
                    'error',
                );
                return;
            }
            setSelectedFile(processed);
            setPreviewUrl(URL.createObjectURL(processed));
        } catch {
            showToast('Could not process image.', 'error');
        }
    };

    const handleUpload = () => {
        if (name.trim() === '') {
            showToast('Please enter a decoration name.', 'error');
            return;
        }
        if (!selectedFile) {
            showToast('Please select an image file.', 'error');
            return;
        }
        uploadMutation.mutate({ name: name.trim(), file: selectedFile });
    };

    const handleShare = () => {
        if (!user?.decorationId) return;
        const url = `${globalThis.location.origin}/decorations/${user.decorationId}`;
        void navigator.clipboard.writeText(url).then(() => {
            showToast('Shareable link copied to clipboard!', 'success');
        });
    };

    if (!user) return null;

    return (
        <div className="max-w-3xl space-y-8 pb-20">
            <Heading level={3}>Avatar Decorations</Heading>

            {/* Active decoration */}
            <section className="space-y-4">
                <Heading level={4}>Active Decoration</Heading>
                <div
                    className="flex items-center gap-6 rounded-xl border border-border-subtle bg-bg-subtle p-6"
                    onMouseEnter={() => {
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        setIsHovered(false);
                    }}
                >
                    {/* Avatar preview with decoration ring */}
                    <div className="relative shrink-0">
                        <div
                            className="h-24 w-24 overflow-hidden rounded-full border-2 border-border-subtle"
                            style={{ background: 'var(--bg-secondary)' }}
                        >
                            {user.profilePicture ? (
                                <img
                                    alt="Your avatar"
                                    className="h-full w-full object-cover"
                                    src={user.profilePicture}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                                    {user.username[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        {user.decorationId ? (
                            <PausedAnimatedImage
                                alt=""
                                className="pointer-events-none absolute inset-0 z-10 h-full w-full scale-125 object-cover"
                                paused={limitedAnimations || !isHovered}
                                src={getDecorationUrl(user.decorationId, 128)}
                            />
                        ) : null}
                        {user.decorationId ? null : (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-10">
                                <Sparkles size={36} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {user.decorationId ? (
                            <>
                                <span className="font-semibold text-foreground">
                                    A decoration is currently active.
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Remove it or share the link below.
                                </span>
                                <div className="mt-1 flex gap-2">
                                    <Button
                                        disabled={removeMutation.isPending}
                                        icon={Trash2}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            removeMutation.mutate();
                                        }}
                                    >
                                        Remove
                                    </Button>
                                    <Button
                                        icon={Share2}
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleShare}
                                    >
                                        Share Link
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                No active decoration. Upload one below to add
                                flair to your avatar.
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <DecorationCollection
                decorations={myDecorations}
                isDeleting={deleteDecorationMutation.isPending}
                isLoading={isLoadingDecorations}
                user={user}
                onApply={applyMutation.mutate}
                onRequestDelete={setDecorationToDelete}
            />

            <DecorationUploadSection
                fileInputRef={fileInputRef}
                isUploading={uploadMutation.isPending}
                name={name}
                previewUrl={previewUrl}
                selectedFile={selectedFile}
                onFileChange={(e): void => void handleFileChange(e)}
                onNameChange={setName}
                onUpload={handleUpload}
            />

            <Modal
                isOpen={!!decorationToDelete}
                title="Delete Decoration"
                onClose={() => {
                    setDecorationToDelete(null);
                }}
            >
                {decorationToDelete ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to permanently delete the
                            decoration{' '}
                            <span className="font-bold text-foreground">
                                {decorationToDelete.name}
                            </span>
                            ? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setDecorationToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={deleteDecorationMutation.isPending}
                                variant="danger"
                                onClick={() => {
                                    deleteDecorationMutation.mutate(
                                        decorationToDelete.id,
                                    );
                                }}
                            >
                                {deleteDecorationMutation.isPending
                                    ? 'Deleting...'
                                    : 'Delete'}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};
