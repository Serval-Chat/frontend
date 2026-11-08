import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { DevSidebar } from './DevSidebar';

const CreatorRoute = (): ReactNode => (
    <>
        <DevSidebar />
        <div data-testid="creator-page" />
    </>
);

const renderSidebar = (entry = '/developer/bots'): void => {
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route element={<DevSidebar />} path="/developer/bots" />
                <Route
                    element={<CreatorRoute />}
                    path="/developer/bot-creator"
                />
            </Routes>
        </MemoryRouter>,
    );
};

describe('DevSidebar', (): void => {
    it('renders the portal navigation', (): void => {
        renderSidebar();

        expect(
            screen.getByRole('link', { name: /My Bots/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /SDK Docs/ }),
        ).toBeInTheDocument();
    });

    it('styles New Bot like the other sidebar rows, not a filled button', (): void => {
        render(
            <MemoryRouter initialEntries={['/developer/settings']}>
                <DevSidebar />
            </MemoryRouter>,
        );

        const newBot = screen.getByRole('link', { name: /New Bot/ });
        const myBots = screen.getByRole('link', { name: /My Bots/ });
        expect(myBots.className).not.toContain('bg-primary/10');
        expect(newBot.className).toBe(myBots.className);
        expect(screen.queryByRole('button', { name: /New Bot/ })).toBeNull();
    });

    it('opens the bot creator page from the New Bot row', (): void => {
        renderSidebar();

        fireEvent.click(screen.getByRole('link', { name: /New Bot/ }));

        expect(screen.getByTestId('creator-page')).toBeInTheDocument();
    });
});
