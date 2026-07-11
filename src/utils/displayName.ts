export const resolveDisplayName = (
    ...candidates: Array<string | null | undefined>
): string | undefined =>
    candidates.find(
        (candidate): candidate is string =>
            typeof candidate === 'string' && candidate.trim() !== '',
    );
