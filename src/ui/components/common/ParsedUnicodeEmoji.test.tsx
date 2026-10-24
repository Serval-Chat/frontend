import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ParsedUnicodeEmoji } from './ParsedUnicodeEmoji';

describe('ParsedUnicodeEmoji', (): void => {
    it('exposes the emoji short name through an image role', (): void => {
        render(<ParsedUnicodeEmoji content="🙏" />);

        expect(screen.getByRole('img', { name: 'pray' })).toBeInTheDocument();
    });
});
