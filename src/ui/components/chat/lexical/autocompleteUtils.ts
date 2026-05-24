export const shouldAutocompleteHandleEnter = (
    textBeforeCursor: string | null,
): boolean => {
    if (textBeforeCursor === null) {
        return false;
    }

    const autocompleteMatch = textBeforeCursor.match(
        /(^|\s)([@:#])([^@#\s]{0,20})$/,
    );
    if (autocompleteMatch) {
        const trigger = autocompleteMatch[2];
        const matchingString = autocompleteMatch[3];
        return trigger !== ':' || matchingString.length >= 2;
    }

    return /^\/[a-zA-Z0-9_-]{0,50}$/.test(textBeforeCursor);
};
