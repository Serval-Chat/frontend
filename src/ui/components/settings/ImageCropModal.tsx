import React, { useState } from 'react';

import { Check, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import type { CropSelection } from '@/utils/imageProcessor';
import { processProfileImage } from '@/utils/imageProcessor';

import { ImageCropper } from './ImageCropper';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    type: 'avatar' | 'banner' | 'server-banner' | 'emoji' | 'role-icon';
    onConfirm: (processedFile: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    onClose,
    imageFile,
    type,
    onConfirm,
}) => {
    const [crop, setCrop] = useState<CropSelection | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!imageFile) return null;

    const aspectRatio =
        type === 'avatar' || type === 'emoji' || type === 'role-icon'
            ? 1
            : type === 'server-banner'
              ? 16 / 9
              : 1136 / 400;

    const handleConfirm = async (): Promise<void> => {
        if (!crop) return;

        setIsProcessing(true);
        try {
            const processingType =
                type === 'emoji' || type === 'role-icon' ? 'avatar' : type;
            const processed = await processProfileImage(
                imageFile,
                processingType,
                crop,
            );
            onConfirm(processed);
            onClose();
        } catch (error) {
            console.error('Failed to process image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmClick = (): void => {
        void handleConfirm();
    };

    const getTitle = (): string => {
        switch (type) {
            case 'avatar':
                return 'Crop your profile picture';
            case 'emoji':
                return 'Crop your emoji';
            case 'role-icon':
                return 'Crop your role icon';
            case 'server-banner':
            case 'banner':
                return 'Crop your banner';
        }
    };

    return (
        <Modal
            className="w-[90vw] max-w-2xl"
            isOpen={isOpen}
            title={getTitle()}
            onClose={onClose}
        >
            <div className="flex flex-col gap-6">
                <ImageCropper
                    aspectRatio={aspectRatio}
                    className="h-[400px]"
                    imageFile={imageFile}
                    onCropChange={setCrop}
                />

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <Text as="p">
                        Drag corners to resize and center to move the crop area.
                    </Text>
                    <div className="flex gap-3">
                        <Button
                            disabled={isProcessing}
                            variant="normal"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            loading={isProcessing}
                            variant="primary"
                            onClick={handleConfirmClick}
                        >
                            {!isProcessing && (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            Apply Crop
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
