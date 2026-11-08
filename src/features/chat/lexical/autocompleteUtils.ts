export const shouldAutocompleteHandleEnter = (
    textBeforeCursor: string | null,
): boolean => {
    if (textBeforeCursor === null) {
        return false;
    }

    const autocompleteMatch = /(^|\s)([@:#])([^@#\s]{0,20})$/.exec(
        textBeforeCursor,
    );
    if (autocompleteMatch) {
        const trigger = autocompleteMatch[2];
        // Both capture groups are mandatory in the regex, so a match guarantees
        // they are defined.
        const matchingString = autocompleteMatch[3]!;
        return trigger !== ':' || matchingString.length >= 2;
    }

    return /^\/[a-zA-Z0-9_-]{0,50}$/.test(textBeforeCursor);
};
