import { describe, expect, it } from 'vitest';

import { detectTokensInText } from './tokenDetector';

describe('tokenDetector', () => {
    it('should return false for regular messages', () => {
        const text = 'Hello world! Check out https://example.com';
        const result = detectTokensInText(text);
        expect(result.containsToken).toBe(false);
        expect(result.detectedTokens).toHaveLength(0);
    });

    it('should detect JWT tokens as user tokenType', () => {
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const result = detectTokensInText(`My token is ${jwt}`);
        expect(result.containsToken).toBe(true);
        expect(result.tokenType).toBe('user');
        expect(result.detectedTokens).toContain(jwt);
    });

    it('should detect serchat_ bot tokens as bot tokenType', () => {
        const botToken =
            'serchat_0000000000000000000000000000000000000000000000000000000000000000';
        const result = detectTokensInText(`Here is the token: ${botToken}`);
        expect(result.containsToken).toBe(true);
        expect(result.tokenType).toBe('bot');
        expect(result.detectedTokens).toContain(botToken);
    });
});
