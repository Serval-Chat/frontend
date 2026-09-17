import { describe, expect, it } from 'vitest';

import { SERVER_SUBPAGE_PATHS, isServerSubpage } from './serverSubpages';

describe('isServerSubpage', (): void => {
    it('matches every path in SERVER_SUBPAGE_PATHS', (): void => {
        for (const suffix of Object.values(SERVER_SUBPAGE_PATHS)) {
            expect(
                isServerSubpage(`/chat/@server/123456789012345678${suffix}`),
            ).toBe(true);
        }
    });

    it('returns false for a plain channel path', (): void => {
        expect(
            isServerSubpage(
                '/chat/@server/123456789012345678/channel/987654321098765432',
            ),
        ).toBe(false);
    });

    it('returns false for the server root path', (): void => {
        expect(isServerSubpage('/chat/@server/123456789012345678')).toBe(
            false,
        );
    });
});
