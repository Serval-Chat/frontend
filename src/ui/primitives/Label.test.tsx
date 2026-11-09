import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from './Label';

describe('Label', (): void => {
    it('uses the shared uppercase field-label style and links to its control', (): void => {
        render(
            <>
                <Label htmlFor="name">Display name</Label>
                <input id="name" />
            </>,
        );
        const label = screen.getByText('Display name');
        expect(label).toHaveClass(
            'text-xs',
            'font-bold',
            'uppercase',
            'tracking-wider',
        );
        expect(screen.getByLabelText('Display name')).toHaveAttribute(
            'id',
            'name',
        );
    });

    it('offers an inline variant for rows that wrap their control', (): void => {
        render(<Label variant="inline">Row</Label>);
        expect(screen.getByText('Row')).toHaveClass('inline-flex', 'text-sm');
    });
});
