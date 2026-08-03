const BOT_TOKEN_REGEX = /\bserchat_[a-f0-9]{64}\b/gi;
const USER_TOKEN_REGEX =
    /\b(?:[A-Za-z0-9_-]{24,32}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/gi;

export type TokenType = 'user' | 'bot';

export interface TokenDetectionResult {
    containsToken: boolean;
    detectedTokens: string[];
    tokenType?: TokenType;
}

export const detectTokensInText = (text: string): TokenDetectionResult => {
    if (!text || typeof text !== 'string') {
        return { containsToken: false, detectedTokens: [] };
    }

    const botMatches = Array.from(text.matchAll(BOT_TOKEN_REGEX), (m) => m[0]);
    if (botMatches.length > 0) {
        return {
            containsToken: true,
            detectedTokens: Array.from(new Set(botMatches)),
            tokenType: 'bot',
        };
    }

    const userMatches = Array.from(text.matchAll(USER_TOKEN_REGEX), (m) => m[0]);
    if (userMatches.length > 0) {
        return {
            containsToken: true,
            detectedTokens: Array.from(new Set(userMatches)),
            tokenType: 'user',
        };
    }

    return { containsToken: false, detectedTokens: [] };
};
