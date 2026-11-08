import { StrictMode } from 'react';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { QueuedFile } from '@/hooks/chat/useFileQueue';

import { FileQueue } from './FileQueue';

const imageFile = (): QueuedFile => ({
    id: '1',
    file: new File(['x'], 'cat.png', { type: 'image/png' }),
    isSpoiler: false,
    progress: 0,
    status: 'idle',
});

describe('FileQueue', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('keeps the rendered preview URL alive under StrictMode', (): void => {
        let counter = 0;
        vi.spyOn(URL, 'createObjectURL').mockImplementation(
            (): string => `blob:preview-${++counter}`,
        );
        const revokeSpy = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation((): void => undefined);

        render(
            <StrictMode>
                <FileQueue
                    files={[imageFile()]}
                    onRemove={vi.fn()}
                    onToggleSpoiler={vi.fn()}
                />
            </StrictMode>,
        );

        const src = screen.getByAltText('cat.png').getAttribute('src');
        expect(src).toMatch(/^blob:preview-/);
        expect(revokeSpy).not.toHaveBeenCalledWith(src);
    });

    it('revokes the preview URL on unmount', (): void => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
        const revokeSpy = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation((): void => undefined);

        const { unmount } = render(
            <FileQueue
                files={[imageFile()]}
                onRemove={vi.fn()}
                onToggleSpoiler={vi.fn()}
            />,
        );
        unmount();

        expect(revokeSpy).toHaveBeenCalledWith('blob:preview');
    });
});
