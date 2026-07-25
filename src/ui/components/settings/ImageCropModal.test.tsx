import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ImageCropModal } from './ImageCropModal';


const mockShowToast = vi.fn();

vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

const mockProcessProfileImage = vi.fn();

vi.mock('@/utils/imageProcessor', () => ({
    processProfileImage: (...args: unknown[]) => mockProcessProfileImage(...args),
}));

vi.mock('./ImageCropper', () => ({
    ImageCropper: ({
        onCropChange,
    }: {
        onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
    }) => {
        useEffect(() => {
            onCropChange({ x: 0, y: 0, width: 100, height: 100 });
        }, [onCropChange]);
        return <div data-testid="image-cropper" />;
    },
}));

const mockFile = new File(['data'], 'icon.png', { type: 'image/png' });

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    imageFile: mockFile,
    type: 'avatar' as const,
    onConfirm: vi.fn(),
};

describe('ImageCropModal – error feedback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows an error toast when image processing throws with a message', async () => {
        mockProcessProfileImage.mockRejectedValue(
            new Error('Invalid crop selection: out of bounds or zero size.'),
        );

        render(<ImageCropModal {...defaultProps} />);

        const applyButton = screen.getByRole('button', { name: /apply crop/i });
        await act(async () => {
            fireEvent.click(applyButton);
        });

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                'Invalid crop selection: out of bounds or zero size.',
                'error',
            );
        });

        expect(defaultProps.onClose).not.toHaveBeenCalled();
        expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('shows a generic error toast when the thrown value has no message', async () => {
        mockProcessProfileImage.mockRejectedValue('oops');

        render(<ImageCropModal {...defaultProps} />);

        const applyButton = screen.getByRole('button', { name: /apply crop/i });
        await act(async () => {
            fireEvent.click(applyButton);
        });

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                'Failed to process image. Please try a different file.',
                'error',
            );
        });
    });

    it('does NOT show a toast and closes the modal on success', async () => {
        const processed = new File(['processed'], 'icon-processed.webp', {
            type: 'image/webp',
        });

        mockProcessProfileImage.mockResolvedValue(processed);

        render(<ImageCropModal {...defaultProps} />);

        const applyButton = screen.getByRole('button', { name: /apply crop/i });
        await act(async () => {
            fireEvent.click(applyButton);
        });

        await waitFor(() => {
            expect(defaultProps.onConfirm).toHaveBeenCalledWith(processed);
            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        expect(mockShowToast).not.toHaveBeenCalled();
    });
});
