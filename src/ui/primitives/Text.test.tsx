import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Text } from './Text';

describe('Text', (): void => {
    it('renders a span with no classes when no props are given', (): void => {
        render(<Text>plain</Text>);
        const el = screen.getByText('plain');
        expect(el.tagName).toBe('SPAN');
        expect(el).not.toHaveAttribute('class');
    });

    it('maps props to the matching Tailwind utilities', (): void => {
        render(
            <Text
                align="center"
                decoration="underline"
                fontStyle="italic"
                leading="tight"
                size="sm"
                tracking="wide"
                transform="uppercase"
                variant="muted"
                weight="semibold"
                wrap="nowrap"
            >
                styled
            </Text>,
        );
        expect(screen.getByText('styled')).toHaveClass(
            'text-center',
            'underline',
            'italic',
            'leading-tight',
            'text-sm',
            'tracking-wide',
            'uppercase',
            'text-muted-foreground',
            'font-semibold',
            'whitespace-nowrap',
        );
    });

    it('uses the 2xs token for the smallest size', (): void => {
        render(<Text size="2xs">tiny</Text>);
        expect(screen.getByText('tiny')).toHaveClass('text-2xs');
    });

    it('lets an explicit prop win over a conflicting className', (): void => {
        render(
            <Text
                className="text-lg font-bold text-danger"
                size="sm"
                variant="muted"
            >
                conflict
            </Text>,
        );
        const el = screen.getByText('conflict');
        expect(el).toHaveClass('text-sm', 'text-muted-foreground', 'font-bold');
        expect(el).not.toHaveClass('text-lg');
        expect(el).not.toHaveClass('text-danger');
    });

    it('keeps className utilities that no prop sets', (): void => {
        render(
            <Text className="truncate px-1" size="xs">
                extra
            </Text>,
        );
        expect(screen.getByText('extra')).toHaveClass(
            'truncate',
            'px-1',
            'text-xs',
        );
    });

    it('renders the requested element and passes other attributes through', (): void => {
        render(
            <Text as="label" htmlFor="field" title="hint">
                label text
            </Text>,
        );
        const el = screen.getByText('label text');
        expect(el.tagName).toBe('LABEL');
        expect(el).toHaveAttribute('for', 'field');
        expect(el).toHaveAttribute('title', 'hint');
    });

    it('renders a hidden skeleton placeholder in skeleton mode', (): void => {
        const { container } = render(
            <Text skeleton size="sm">
                loading
            </Text>,
        );
        const outer = container.firstElementChild;
        expect(outer).toHaveAttribute('aria-hidden', 'true');
        expect(outer).toHaveClass('relative', 'inline-block', 'text-sm');
    });
});
