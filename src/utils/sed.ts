const SED_REGEX = /^s\/((?:\\\/|[^/])+)\/((?:\\\/|[^/])*)\/?([ig]*)$/;

export const isSedCommand = (message: string): boolean =>
    SED_REGEX.test(message);

export const applySedCommand = (
    originalMessage: string,
    sedCommand: string,
): string => {
    const match = SED_REGEX.exec(sedCommand);
    if (!match) {
        return originalMessage;
    }

    const [, searchPattern, replacement, flags] = match;

    if (searchPattern === undefined || replacement === undefined) {
        return originalMessage;
    }

    const unescapedSearch = searchPattern.replaceAll(String.raw`\/`, '/');
    const unescapedReplacement = replacement.replaceAll(String.raw`\/`, '/');

    try {
        const regex = new RegExp(unescapedSearch, flags);
        return originalMessage.replace(regex, () => unescapedReplacement);
    } catch {
        return originalMessage;
    }
};
