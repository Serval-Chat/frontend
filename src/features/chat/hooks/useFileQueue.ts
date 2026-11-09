import { useCallback, useMemo, useState } from 'react';

export interface QueuedFile {
    id: string;
    file: File;
    isSpoiler: boolean;
    progress: number;
    status: 'idle' | 'uploading' | 'completed' | 'error';
}

export function useFileQueue(): {
    files: QueuedFile[];
    addFiles: (newFiles: FileList | File[]) => void;
    removeFile: (id: string) => void;
    toggleSpoiler: (id: string) => void;
    updateFileProgress: (id: string, progress: number) => void;
    updateFileStatus: (id: string, status: QueuedFile['status']) => void;
    clearQueue: () => void;
} {
    const [files, setFiles] = useState<QueuedFile[]>([]);

    const addFiles = useCallback((newFiles: FileList | File[]): void => {
        const fileArray = [...newFiles];
        const queuedFiles: QueuedFile[] = fileArray.map(
            (
                file,
            ): {
                id: string;
                file: File;
                isSpoiler: false;
                progress: number;
                status: 'idle';
            } => ({
                id:
                    Math.random().toString(36).slice(7) +
                    Date.now().toString(36),
                file,
                isSpoiler: false,
                progress: 0,
                status: 'idle',
            }),
        );
        setFiles((prev): QueuedFile[] => [...prev, ...queuedFiles]);
    }, []);

    const removeFile = useCallback((id: string): void => {
        setFiles((prev): QueuedFile[] =>
            prev.filter((f): boolean => f.id !== id),
        );
    }, []);

    const toggleSpoiler = useCallback((id: string): void => {
        setFiles((prev): QueuedFile[] =>
            prev.map(
                (f): QueuedFile =>
                    f.id === id ? { ...f, isSpoiler: !f.isSpoiler } : f,
            ),
        );
    }, []);

    const updateFileProgress = useCallback(
        (id: string, progress: number): void => {
            setFiles((prev): QueuedFile[] =>
                prev.map(
                    (f): QueuedFile => (f.id === id ? { ...f, progress } : f),
                ),
            );
        },
        [],
    );

    const updateFileStatus = useCallback(
        (id: string, status: QueuedFile['status']): void => {
            setFiles((prev): QueuedFile[] =>
                prev.map(
                    (f): QueuedFile => (f.id === id ? { ...f, status } : f),
                ),
            );
        },
        [],
    );

    const clearQueue = useCallback((): void => {
        setFiles([]);
    }, []);

    return useMemo(
        () => ({
            files,
            addFiles,
            removeFile,
            toggleSpoiler,
            updateFileProgress,
            updateFileStatus,
            clearQueue,
        }),
        [
            files,
            addFiles,
            removeFile,
            toggleSpoiler,
            updateFileProgress,
            updateFileStatus,
            clearQueue,
        ],
    );
}
