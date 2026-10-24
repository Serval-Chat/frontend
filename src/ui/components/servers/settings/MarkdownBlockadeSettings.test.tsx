import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MARKDOWN_FEATURE_OPTIONS } from '@/utils/markdownBlockade';

import { MarkdownBlockadeSettings } from './MarkdownBlockadeSettings';

vi.mock('@/api/servers/servers.queries', () => ({
    useMembers: (): { data: never[] } => ({ data: [] }),
    useRoles: (): { data: never[] } => ({ data: [] }),
}));

describe('MarkdownBlockadeSettings', (): void => {
    it('labels each markdown feature toggle with its visible feature name', (): void => {
        render(
            <MarkdownBlockadeSettings
                isPending={false}
                rules={[
                    {
                        targetType: 'everyone',
                        targetId: 'everyone',
                        features: [],
                    },
                ]}
                serverId="server-1"
                onSave={vi.fn()}
            />,
        );

        for (const feature of MARKDOWN_FEATURE_OPTIONS) {
            expect(
                screen.getByRole('checkbox', { name: feature.label }),
            ).toBeInTheDocument();
        }
    });
});
