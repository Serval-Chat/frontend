const SILENCE_FLOOR_DB = -40;

export function linearToPerceptualGain(value: number): number {
    const clamped = Math.min(1, Math.max(0, value));
    if (clamped <= 0) return 0;
    const db = SILENCE_FLOOR_DB * (1 - clamped);
    return Math.pow(10, db / 20);
}
