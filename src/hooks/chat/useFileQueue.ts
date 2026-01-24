import { useCallback, useState } from 'react';

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

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const queuedFiles: QueuedFile[] = fileArray.map((file) => ({
            id:
                Math.random().toString(36).substring(7) +
                Date.now().toString(36),
            file,
            isSpoiler: false,
            progress: 0,
            status: 'idle',
        }));
        setFiles((prev) => [...prev, ...queuedFiles]);
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const toggleSpoiler = useCallback((id: string) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, isSpoiler: !f.isSpoiler } : f,
            ),
        );
    }, []);

    const updateFileProgress = useCallback((id: string, progress: number) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress } : f)),
        );
    }, []);

    const updateFileStatus = useCallback(
        (id: string, status: QueuedFile['status']) => {
            setFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, status } : f)),
            );
        },
        [],
    );

    const clearQueue = useCallback(() => {
        setFiles([]);
    }, []);

    return {
        files,
        addFiles,
        removeFile,
        toggleSpoiler,
        updateFileProgress,
        updateFileStatus,
        clearQueue,
    };
}
