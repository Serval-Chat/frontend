import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ServerMembersPage } from './ServerMembersPage';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useParams: vi.fn(),
}));

vi.mock('./ServerMembersSettings', () => ({
    ServerMembersSettings: ({ serverId }: { serverId: string }) => (
        <div data-testid="members-settings">{serverId}</div>
    ),
}));

describe('ServerMembersPage', (): void => {
    it('renders nothing when there is no serverId in the route', (): void => {
        vi.mocked(useParams).mockReturnValue({});
        vi.mocked(useNavigate).mockReturnValue(vi.fn());

        const { container } = render(<ServerMembersPage />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the members list for the current server', (): void => {
        vi.mocked(useParams).mockReturnValue({ serverId: 'server-1' });
        vi.mocked(useNavigate).mockReturnValue(vi.fn());

        render(<ServerMembersPage />);

        expect(screen.getByTestId('members-settings')).toHaveTextContent(
            'server-1',
        );
    });

    it('navigates back to the server on back button click', (): void => {
        const mockNavigate = vi.fn();
        vi.mocked(useParams).mockReturnValue({ serverId: 'server-1' });
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);

        render(<ServerMembersPage />);

        fireEvent.click(screen.getByLabelText('Back to server'));

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@server/server-1');
    });
});
