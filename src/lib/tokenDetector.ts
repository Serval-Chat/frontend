const JWT_OR_AUTH_TOKEN_REGEX =
    /\b(?:[A-Za-z0-9_-]{24,32}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g;

export interface TokenDetectionResult {
    containsToken: boolean;
    detectedTokens: string[];
}

export const detectTokensInText = (text: string): TokenDetectionResult => {
    if (!text || typeof text !== 'string') {
        return { containsToken: false, detectedTokens: [] };
    }

    const matches = Array.from(text.matchAll(JWT_OR_AUTH_TOKEN_REGEX), (m) => m[0]);
    const uniqueMatches = Array.from(new Set(matches));

    return {
        containsToken: uniqueMatches.length > 0,
        detectedTokens: uniqueMatches,
    };
};
