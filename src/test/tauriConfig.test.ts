import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

interface CspDirectives {
    [directive: string]: string | string[] | undefined;
}

interface TauriConfig {
    app: {
        withGlobalTauri?: boolean;
        windows?: { devtools?: boolean }[];
        security?: {
            csp?: string | CspDirectives | null;
        };
    };
}

const loadTauriConfig = (): TauriConfig => {
    const configPath = path.resolve(
        __dirname,
        '../../src-tauri/tauri.conf.json',
    );
    return JSON.parse(readFileSync(configPath, 'utf-8')) as TauriConfig;
};

const loadEnvOrigin = (
    envFile: string,
    key: 'VITE_API_BASE_URL' | 'VITE_WS_BASE_URL',
): string => {
    const envPath = path.resolve(__dirname, '../..', envFile);
    const contents = readFileSync(envPath, 'utf-8');
    const match = new RegExp(`^${key}=(.+)$`, 'm').exec(contents);
    if (!match) throw new Error(`${key} not found in ${envFile}`);
    return new URL(match[1]!.trim()).origin;
};

const sourcesFor = (
    csp: string | CspDirectives | null | undefined,
    directive: string,
): string[] => {
    if (!csp || typeof csp === 'string') return [];
    const sources = csp[directive];
    if (!sources) return [];
    return Array.isArray(sources) ? sources : sources.split(' ');
};

const flattenCsp = (csp: string | CspDirectives): string => {
    if (typeof csp === 'string') return csp;
    return Object.values(csp)
        .map((sources) => (Array.isArray(sources) ? sources.join(' ') : sources))
        .join(' ');
};

describe('src-tauri/tauri.conf.json security config', (): void => {
    it('sets a real Content-Security-Policy, not null', (): void => {
        const config = loadTauriConfig();
        expect(config.app.security?.csp).toBeTruthy();
    });

    it('does not allow unsafe-inline or unsafe-eval scripts', (): void => {
        const config = loadTauriConfig();
        const csp = config.app.security?.csp;
        expect(csp).toBeTruthy();
        const flattened = flattenCsp(csp!);
        expect(flattened).not.toContain('unsafe-eval');

        const scriptSrc =
            typeof csp === 'object' && csp !== null
                ? csp['script-src']
                : undefined;
        const scriptSrcStr = Array.isArray(scriptSrc)
            ? scriptSrc.join(' ')
            : (scriptSrc ?? '');
        expect(scriptSrcStr).not.toContain('unsafe-inline');
    });

    it("restricts default-src to 'self'", (): void => {
        const config = loadTauriConfig();
        const csp = config.app.security?.csp;
        expect(typeof csp).toBe('object');
        const defaultSrc = (csp as CspDirectives)['default-src'];
        const defaultSrcStr = Array.isArray(defaultSrc)
            ? defaultSrc.join(' ')
            : defaultSrc;
        expect(defaultSrcStr).toContain("'self'");
    });

    it('does not expose the full Tauri API on window.__TAURI__ to page scripts', (): void => {
        const config = loadTauriConfig();
        expect(config.app.withGlobalTauri).toBe(false);
    });

    it('does not force-enable devtools in release builds', (): void => {
        const config = loadTauriConfig();
        expect(config.app.windows?.[0]?.devtools).toBe(false);
    });

    it("includes the production API origin in img-src and connect-src, so its own images and requests aren't blocked", (): void => {
        const config = loadTauriConfig();
        const csp = config.app.security?.csp;
        const prodApiOrigin = loadEnvOrigin('.env.prod', 'VITE_API_BASE_URL');

        expect(sourcesFor(csp, 'img-src')).toContain(prodApiOrigin);
        expect(sourcesFor(csp, 'connect-src')).toContain(prodApiOrigin);
    });

    it('includes the production WS origin in connect-src', (): void => {
        const config = loadTauriConfig();
        const csp = config.app.security?.csp;
        const prodWsOrigin = loadEnvOrigin('.env.prod', 'VITE_WS_BASE_URL');

        expect(sourcesFor(csp, 'connect-src')).toContain(prodWsOrigin);
    });
});
