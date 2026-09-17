import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RootErrorBoundary } from './RootErrorBoundary';

const Bomb = (): never => {
    throw new Error('boom from a child component');
};

describe('an uncaught render error with no boundary', (): void => {
    it('propagates out of render instead of being handled gracefully', (): void => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation((): void => {});
        try {
            expect(() => render(<Bomb />)).toThrow(
                'boom from a child component',
            );
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});

describe('RootErrorBoundary', (): void => {
    it('renders its children when nothing throws', (): void => {
        render(
            <RootErrorBoundary>
                <div>All good</div>
            </RootErrorBoundary>,
        );
        expect(screen.getByText('All good')).toBeDefined();
    });

    it('catches a render error from a descendant and shows the fallback UI instead of crashing', (): void => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation((): void => {});
        try {
            render(
                <RootErrorBoundary>
                    <Bomb />
                </RootErrorBoundary>,
            );
            expect(screen.getByText('Something went wrong')).toBeDefined();
            expect(
                screen.getByText(
                    'An unexpected error occurred. The issue has been reported.',
                ),
            ).toBeDefined();
            expect(
                screen.queryByText('boom from a child component'),
            ).not.toBeInTheDocument();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});
