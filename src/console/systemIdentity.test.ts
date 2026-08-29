import { beforeEach, describe, expect, it } from 'vitest';

import {
    getCpu,
    getDisk,
    getGpu,
    getHostModel,
    getHostname,
    getMemory,
    getOsProfile,
    getResolution,
} from '@/console/systemIdentity';

describe('systemIdentity', (): void => {
    beforeEach((): void => {
        localStorage.clear();
    });

    it('generates the hostname once and keeps returning the same value', (): void => {
        const first = getHostname();
        const second = getHostname();
        const third = getHostname();

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    it('generates the OS profile once and keeps returning the same value', (): void => {
        const first = getOsProfile();
        const second = getOsProfile();

        expect(second).toEqual(first);
    });

    it('generates the host model once and keeps returning the same value', (): void => {
        const first = getHostModel();
        const second = getHostModel();
        const third = getHostModel();

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    it('generates resolution, cpu, gpu, memory, and disk once and keeps returning the same values', (): void => {
        const first = {
            resolution: getResolution(),
            cpu: getCpu(),
            gpu: getGpu(),
            memory: getMemory(),
            disk: getDisk(),
        };
        const second = {
            resolution: getResolution(),
            cpu: getCpu(),
            gpu: getGpu(),
            memory: getMemory(),
            disk: getDisk(),
        };

        expect(second).toEqual(first);
    });

    it('persists the identity to localStorage so it survives a reload', (): void => {
        const hostname = getHostname();
        const hostModel = getHostModel();
        const osProfile = getOsProfile();

        const raw = localStorage.getItem('serchat.console.systemIdentity.v2');
        expect(raw).toBeTruthy();

        const stored = JSON.parse(raw as string);
        expect(stored.hostname).toBe(hostname);
        expect(stored.hostModel).toBe(hostModel);
        expect(stored.osProfile).toEqual(osProfile);
    });

    it('keeps OS, Kernel, and Shell consistent with the same OS family', (): void => {
        const { os, shell, kernel } = getOsProfile();

        if (os.includes('DOS')) {
            expect(shell).toContain('command.com');
            expect(kernel).toContain('DOS');
            expect(kernel).not.toContain('NT');
        } else {
            expect(shell).toContain('cmd.exe');
            expect(shell).not.toContain('command.com');
            expect(kernel).toContain('NT');
        }
    });

    it('regenerates a fresh identity once localStorage is cleared', (): void => {
        getHostname();
        const rawBefore = localStorage.getItem(
            'serchat.console.systemIdentity.v2',
        );
        expect(rawBefore).toBeTruthy();

        localStorage.clear();

        const rawAfter = localStorage.getItem(
            'serchat.console.systemIdentity.v2',
        );
        expect(rawAfter).toBeNull();

        expect(typeof getHostname()).toBe('string');
        expect(
            localStorage.getItem('serchat.console.systemIdentity.v2'),
        ).toBeTruthy();
    });
});
