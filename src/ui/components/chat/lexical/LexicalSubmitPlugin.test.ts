import { describe, expect, it } from 'vitest';

import { shouldAutocompleteHandleEnter } from './autocompleteUtils';

describe('shouldAutocompleteHandleEnter', () => {
    it('does not block submit when there is no text trigger at the cursor', () => {
        expect(shouldAutocompleteHandleEnter(null)).toBe(false);
        expect(shouldAutocompleteHandleEnter('hello 😀')).toBe(false);
    });

    it('blocks submit while mention, channel, emoji, or slash autocomplete is active', () => {
        expect(shouldAutocompleteHandleEnter('@alice')).toBe(true);
        expect(shouldAutocompleteHandleEnter('hello #general')).toBe(true);
        expect(shouldAutocompleteHandleEnter('hello :sm')).toBe(true);
        expect(shouldAutocompleteHandleEnter('/poke')).toBe(true);
    });

    it('keeps short colon sequences from acting like autocomplete', () => {
        expect(shouldAutocompleteHandleEnter(':')).toBe(false);
        expect(shouldAutocompleteHandleEnter(':a')).toBe(false);
        expect(shouldAutocompleteHandleEnter('hello :3')).toBe(false);
    });
});
