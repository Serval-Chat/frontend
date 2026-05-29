import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Timestamp } from './Timestamp';

describe('Timestamp', (): void => {
    it('floors relative years instead of rounding up', (): void => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-28T00:00:00.000Z'));

        render(<Timestamp flag="R" timestamp={123456789} />);

        expect(screen.getByText('52 years ago')).toBeDefined();

        vi.useRealTimers();
    });
});
