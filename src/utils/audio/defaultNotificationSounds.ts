export const DEFAULT_SOUND_COUNT = 12;

const DEFAULT_SOUND_NORMALIZATION_GAINS: Record<number, number> = {
    1: 4,
    2: 1.029,
    3: 1.851,
    4: 1.311,
    5: 1.895,
    6: 0.922,
    7: 0.655,
    8: 0.83,
    9: 0.729,
    10: 0.865,
    11: 0.721,
    12: 0.75,
};

export function getDefaultSoundUrl(index: number): string {
    return `/sounds/${index}.wav`;
}

export function getDefaultSoundNormalizationGain(index: number): number {
    return DEFAULT_SOUND_NORMALIZATION_GAINS[index] ?? 1;
}
