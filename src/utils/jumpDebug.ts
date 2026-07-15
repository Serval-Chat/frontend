// Opt-in jump/scroll diagnostics. Enable in the browser console with
//   localStorage.jumpDebug = '1'   (reproduce, then `delete localStorage.jumpDebug`).
// Off by default, near-zero cost when disabled.
export const jumpDebug = (label: string, data?: Record<string, unknown>): void => {
    try {
        if (
            typeof localStorage === 'undefined' ||
            !localStorage.getItem('jumpDebug')
        ) {
            return;
        }
    } catch {
        return;
    }
    // eslint-disable-next-line no-console
    console.debug(
        `[jump ${(performance.now() / 1000).toFixed(2)}s] ${label}`,
        data ?? '',
    );
};
