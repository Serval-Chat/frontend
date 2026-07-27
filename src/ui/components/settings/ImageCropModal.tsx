import { useState } from 'react';

import { Check, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import type { CropSelection } from '@/utils/imageProcessor';

import { ImageCropper } from './ImageCropper';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    type:
        | 'avatar'
        | 'banner'
        | 'server-banner'
        | 'emoji'
        | 'role-icon'
        | 'sticker';
    onConfirm: (processedFile: File) => void;
}

export const ImageCropModal = ({
    isOpen,
    onClose,
    imageFile,
    type,
    onConfirm,
}: ImageCropModalProps) => {
    const [crop, setCrop] = useState<CropSelection | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    if (!imageFile) return null;

    const aspectRatio =
        type === 'avatar' || type === 'emoji' || type === 'role-icon'
            ? 1
            : type === 'sticker'
              ? undefined
              : type === 'server-banner'
                ? 16 / 9
                : 1136 / 400;

    const handleConfirm = async (): Promise<void> => {
        if (!crop) return;

        setIsProcessing(true);
        try {
            const { processProfileImage } =
                await import('@/utils/imageProcessor');
            const processed = await processProfileImage(imageFile, type, crop);
            onConfirm(processed);
            onClose();
        } catch (error) {
            console.error('Failed to process image:', error);
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to process image. Please try a different file.',
                'error',
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmClick = (): void => {
        void handleConfirm();
    };

    const getTitle = (): string => {
        switch (type) {
            case 'avatar': {
                return 'Crop your profile picture';
            }
            case 'emoji': {
                return 'Crop your emoji';
            }
            case 'role-icon': {
                return 'Crop your role icon';
            }
            case 'sticker': {
                return 'Crop your sticker';
            }
            case 'server-banner':
            case 'banner': {
                return 'Crop your banner';
            }
        }
    };

    return (
        <Modal
            mobileFullScreen
            className="w-[90vw] max-w-2xl"
            isOpen={isOpen}
            title={getTitle()}
            onClose={onClose}
        >
            <div className="flex h-full flex-col gap-6">
                <ImageCropper
                    aspectRatio={aspectRatio}
                    className="min-h-75 flex-1"
                    imageFile={imageFile}
                    onCropChange={setCrop}
                />

                <div className="flex shrink-0 flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                    <Text as="p">
                        Drag corners to resize and center to move the crop area.
                    </Text>
                    <div className="flex gap-3">
                        <Button
                            disabled={isProcessing}
                            variant="normal"
                            onClick={onClose}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            loading={isProcessing}
                            variant="primary"
                            onClick={handleConfirmClick}
                        >
                            {isProcessing ? null : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Apply Crop
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
