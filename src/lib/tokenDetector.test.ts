import { describe, expect, it } from 'vitest';

import { detectTokensInText } from './tokenDetector';

describe('tokenDetector', () => {
    it('should return false for regular messages', () => {
        const text = 'Hello world! Check out https://example.com';
        const result = detectTokensInText(text);
        expect(result.containsToken).toBe(false);
        expect(result.detectedTokens).toHaveLength(0);
    });

    it('should detect JWT tokens', () => {
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const result = detectTokensInText(`My token is ${jwt}`);
        expect(result.containsToken).toBe(true);
        expect(result.detectedTokens).toContain(jwt);
    });
});
