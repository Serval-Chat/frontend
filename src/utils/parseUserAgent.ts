export type DeviceKind = 'desktop' | 'mobile' | 'tablet';

export interface ParsedUserAgent {
    browser: string;
    os: string;
    device: DeviceKind;
    label: string;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
    [/Edg\//, 'Edge'],
    [/OPR\//, 'Opera'],
    [/Firefox\//, 'Firefox'],
    [/CriOS\//, 'Chrome'],
    [/Chrome\//, 'Chrome'],
    [/FxiOS\//, 'Firefox'],
    [/Safari\//, 'Safari'],
];

const OS_PATTERNS: [RegExp, string][] = [
    [/Windows NT/, 'Windows'],
    [/Mac OS X/, 'macOS'],
    [/Android/, 'Android'],
    [/iPhone|iPad|iPod/, 'iOS'],
    [/CrOS/, 'ChromeOS'],
    [/Linux/, 'Linux'],
];

const parseBrowser = (ua: string): string => {
    for (const [pattern, name] of BROWSER_PATTERNS) {
        if (pattern.test(ua)) return name;
    }
    return 'Unknown browser';
};

const parseOs = (ua: string): string => {
    for (const [pattern, name] of OS_PATTERNS) {
        if (pattern.test(ua)) return name;
    }
    return 'Unknown OS';
};

const parseDevice = (ua: string): DeviceKind => {
    if (/iPad|Tablet/.test(ua)) return 'tablet';
    if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return 'mobile';
    return 'desktop';
};

export const parseUserAgent = (userAgent: string): ParsedUserAgent => {
    const browser = parseBrowser(userAgent);
    const os = parseOs(userAgent);
    const device = parseDevice(userAgent);

    return { browser, os, device, label: `${browser} on ${os}` };
};
