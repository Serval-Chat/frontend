const SED_REGEX = /^s\/((?:\\\/|[^/])+)\/((?:\\\/|[^/])*)\/?([ig]*)$/;

export const isSedCommand = (message: string): boolean =>
    SED_REGEX.test(message);

export const applySedCommand = (
    originalMessage: string,
    sedCommand: string,
): string => {
    const match = sedCommand.match(SED_REGEX);
    if (!match) {
        return originalMessage;
    }

    const [, searchPattern, replacement, flags] = match;

    const unescapedSearch = searchPattern.replace(/\\\//g, '/');
    const unescapedReplacement = replacement.replace(/\\\//g, '/');

    try {
        const regex = new RegExp(unescapedSearch, flags);
        return originalMessage.replace(regex, () => unescapedReplacement);
    } catch {
        return originalMessage;
    }
};
