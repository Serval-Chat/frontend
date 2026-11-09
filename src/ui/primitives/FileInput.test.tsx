import { createRef } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileInput } from './FileInput';

describe('FileInput', (): void => {
    it('is a hidden file input reachable through its ref', (): void => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        render(
            <FileInput
                multiple
                accept="image/*"
                aria-label="Upload avatar"
                ref={ref}
                onChange={onChange}
            />,
        );
        const input = screen.getByLabelText('Upload avatar');
        expect(input).toHaveAttribute('type', 'file');
        expect(input).toHaveAttribute('hidden');
        expect(input).toHaveAttribute('accept', 'image/*');
        expect(ref.current).toBe(input);
        fireEvent.change(input, {
            target: {
                files: [new File(['x'], 'a.png', { type: 'image/png' })],
            },
        });
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
