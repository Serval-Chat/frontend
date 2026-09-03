import { describe, it, expect, vi, afterEach } from 'vitest';

import type { UserSettings } from '@/api/users/users.types';

import { NotificationSoundManager } from './NotificationSoundManager';
import type { AudioPipeline } from './AudioPipeline';

const settingsWith = (
    customCount: number,
    useDefault = true,
): UserSettings => ({
    useDefaultSounds: useDefault,
    notificationSounds: Array.from({ length: customCount }, (_, i) => ({
        id: `c${i}`,
        name: `Custom ${i}`,
        url: `http://x/c${i}.ogg`,
        enabled: true,
        volume: 1,
        normalizationGain: 1,
    })),
});

describe('NotificationSoundManager.pickRandom', () => {
    const manager = new NotificationSoundManager({} as AudioPipeline);

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('gives the defaults collectively one slot, not one slot per default sound', () => {
        const settings = settingsWith(2);
        const randomSpy = vi.spyOn(Math, 'random');
        randomSpy.mockReturnValueOnce(0.9);
        randomSpy.mockReturnValueOnce(0);

        const choice = manager.pickRandom(settings);

        expect(choice?.url).toBe('/sounds/1.wav');
    });

    it('picks the matching custom sound when the roll lands on its slot', () => {
        const settings = settingsWith(2);
        vi.spyOn(Math, 'random').mockReturnValueOnce(0.34);

        const choice = manager.pickRandom(settings);

        expect(choice?.url).toBe('http://x/c1.ogg');
    });

    it('always picks a default when there are no enabled custom sounds', () => {
        const settings = settingsWith(0);
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const choice = manager.pickRandom(settings);

        expect(choice?.url).toMatch(/^\/sounds\/\d+\.wav$/);
    });

    it('returns null when there are no enabled custom sounds and defaults are disabled', () => {
        const settings = settingsWith(0, false);

        expect(manager.pickRandom(settings)).toBeNull();
    });

    it('ignores disabled custom sounds when picking', () => {
        const settings: UserSettings = {
            useDefaultSounds: false,
            notificationSounds: [
                {
                    id: 'c0',
                    name: 'Custom 0',
                    url: 'http://x/c0.ogg',
                    enabled: false,
                    volume: 1,
                    normalizationGain: 1,
                },
            ],
        };

        expect(manager.pickRandom(settings)).toBeNull();
    });
});
