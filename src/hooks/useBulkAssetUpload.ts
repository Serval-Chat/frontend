import { useRef, useState } from 'react';

import JSZip from 'jszip';

import { convertToWebp } from '@/utils/convertToWebp';

export interface BulkStatus {
    total: number;
    uploaded: number;
    errors: number;
    isOpen: boolean;
}

/**
 * shared zip-based bulk asset (emoji/sticker) upload flow: extracts images from a
 * `.zip`, uploads each (converting to webp unless it's a gif), tracks progress,
 * and supports cancel-with-rollback of anything already uploaded.
 *
 * `toName` maps a zip entry's file name to the asset name to upload it under.
 */
export const useBulkAssetUpload = ({
    uploadAsync,
    deleteAsync,
    toName,
}: {
    uploadAsync: (args: {
        name: string;
        file: File;
    }) => Promise<{ id: string }>;
    deleteAsync: (id: string) => Promise<unknown>;
    toName: (fileName: string) => string;
}) => {
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const isCancelledRef = useRef(false);
    const uploadedIdsRef = useRef<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<BulkStatus>({
        total: 0,
        uploaded: 0,
        errors: 0,
        isOpen: false,
    });

    const handleBulkFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) return;

        event.target.value = '';

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            const validFiles = Object.entries(loadedZip.files).filter(
                ([relativePath, zipEntry]): boolean => {
                    if (zipEntry.dir) return false;
                    const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.exec(
                        relativePath,
                    );
                    if (!isImage) return false;
                    const fileName = zipEntry.name.split('/').pop() || '';
                    if (fileName.startsWith('.')) return false;
                    return true;
                },
            );

            if (validFiles.length === 0) return;

            setBulkStatus({
                total: validFiles.length,
                uploaded: 0,
                errors: 0,
                isOpen: true,
            });

            setIsBulkUploading(true);
            isCancelledRef.current = false;
            uploadedIdsRef.current = [];

            for (const [, zipEntry] of validFiles) {
                if (isCancelledRef.current) break;

                const fileName = zipEntry.name.split('/').pop() || '';
                const name = toName(fileName);

                const blob = await zipEntry.async('blob');
                try {
                    const fileToUpload: File = fileName
                        .toLowerCase()
                        .endsWith('.gif')
                        ? new File([blob], fileName, {
                              type: 'image/gif',
                          })
                        : await convertToWebp(blob, fileName);
                    const uploaded = await uploadAsync({
                        name,
                        file: fileToUpload,
                    });
                    uploadedIdsRef.current.push(uploaded.id);
                    setBulkStatus(
                        (prev): BulkStatus => ({
                            ...prev,
                            uploaded: prev.uploaded + 1,
                        }),
                    );
                } catch (error) {
                    console.error(`Failed to process ${fileName}:`, error);
                    setBulkStatus(
                        (prev): BulkStatus => ({
                            ...prev,
                            errors: prev.errors + 1,
                        }),
                    );
                }
            }
        } catch (error) {
            console.error('Failed to process zip file', error);
        } finally {
            setIsBulkUploading(false);
        }
    };

    const handleCancelBulk = async (): Promise<void> => {
        isCancelledRef.current = true;
        setIsCancelling(true);

        const idsToDelete = [...uploadedIdsRef.current];
        await Promise.all(
            idsToDelete.map(async (id): Promise<void> => {
                try {
                    await deleteAsync(id);
                } catch (error) {
                    console.error(`Failed to delete asset ${id}:`, error);
                }
            }),
        );

        uploadedIdsRef.current = [];
        setIsCancelling(false);
        setBulkStatus((prev): BulkStatus => ({ ...prev, isOpen: false }));
    };

    const closeBulkStatus = (): void => {
        setBulkStatus((prev): BulkStatus => ({ ...prev, isOpen: false }));
    };

    return {
        isBulkUploading,
        isCancelling,
        bulkStatus,
        handleBulkFileSelect,
        handleCancelBulk,
        closeBulkStatus,
    };
};
