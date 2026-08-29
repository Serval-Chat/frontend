export interface OsProfile {
    kernel: string;
    os: string;
    shell: string;
}

export interface SystemIdentity {
    cpu: string;
    disk: string;
    gpu: string;
    hostModel: string;
    hostname: string;
    memory: string;
    osProfile: OsProfile;
    resolution: string;
}

const STORAGE_KEY = 'serchat.console.systemIdentity.v2';

const HOSTNAMES = [
    'WORKSTATION-7',
    'SERCHAT-PC01',
    'NTBOX-42',
    'CONSOLE-9000',
    'RETRO-TERM',
    'DESKTOP-QX19K',
];

const HOST_MODELS = [
    'Serchat Custom Tower',
    'Serchat Portable NX',
    'Generic NT-Compatible PC',
    'Serchat Rack Server R1',
];

const OS_PROFILE_TEMPLATES: {
    os: string;
    shell: string;
    kernel: () => string;
}[] = [
    {
        os: 'Serchat NT Workstation 4.51 x86_64',
        shell: 'cmd.exe 4.51',
        kernel: (): string => `NT 4.51.${randomInt(1000, 1999)}`,
    },
    {
        os: 'Serchat NT Server 2026 x86_64',
        shell: 'cmd.exe 11.0',
        kernel: (): string => `NT 11.0.${randomInt(1000, 9999)}`,
    },
    {
        os: 'Serchat NT 10.0.26100 x86_64',
        shell: 'cmd.exe 10.0',
        kernel: (): string => 'NT 10.0.26100',
    },
    {
        os: 'Serchat DOS 7.1 x86',
        shell: 'command.com 7.1',
        kernel: (): string => 'DOS 7.1',
    },
];

const RESOLUTIONS = [
    '1920x1080',
    '2560x1440',
    '3840x2160',
    '1280x1024',
    '1366x768',
];

const CPUS = [
    'Intel Core i7-9700K',
    'Intel Core i9-13900K',
    'AMD Ryzen 7 5800X',
    'AMD Ryzen 9 7950X',
    'Intel Pentium III 800MHz',
    'AMD Athlon XP 2600+',
];

const GPUS = [
    'NVIDIA GeForce RTX 3070',
    'NVIDIA GeForce RTX 4090',
    'AMD Radeon RX 6800 XT',
    'S3 Trio64V+ 2MB',
    'ATI Rage 128 Pro',
    'NVIDIA RIVA TNT2',
];

const DISK_LETTERS = ['C:', 'D:'];
const MEMORY_SIZES_GIB = [4, 8, 16, 32, 64];
const DISK_SIZES_GB = [128, 256, 512, 1024, 2048];

function pick<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)] as T;
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomUsage(total: number): { used: number; percent: number } {
    const fraction = 0.15 + Math.random() * 0.65;
    const used = Math.round(total * fraction * 10) / 10;
    const percent = Math.round((used / total) * 100);
    return { used, percent };
}

const generateCpu = (): string => {
    const cores = pick([2, 4, 6, 8, 12, 16, 24]);
    const clockGhz = (randomInt(10, 55) / 10).toFixed(1);
    return `${pick(CPUS)} (${cores}) @ ${clockGhz}GHz`;
};

const generateMemory = (): string => {
    const total = pick(MEMORY_SIZES_GIB);
    const { used, percent } = randomUsage(total);
    return `${used.toFixed(1)}GiB / ${total.toFixed(1)}GiB (${percent}%)`;
};

const generateDisk = (): string => {
    const total = pick(DISK_SIZES_GB);
    const { used, percent } = randomUsage(total);
    return `${pick(DISK_LETTERS)} ${Math.round(used)}GB / ${total}GB (${percent}%)`;
};

const isStorageAvailable = (): boolean => typeof localStorage !== 'undefined';

const isValidIdentity = (value: unknown): value is SystemIdentity => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<SystemIdentity>;
    return (
        typeof candidate.hostname === 'string' &&
        typeof candidate.hostModel === 'string' &&
        typeof candidate.resolution === 'string' &&
        typeof candidate.cpu === 'string' &&
        typeof candidate.gpu === 'string' &&
        typeof candidate.memory === 'string' &&
        typeof candidate.disk === 'string' &&
        !!candidate.osProfile &&
        typeof candidate.osProfile.os === 'string' &&
        typeof candidate.osProfile.shell === 'string' &&
        typeof candidate.osProfile.kernel === 'string'
    );
};

const loadPersistedIdentity = (): SystemIdentity | null => {
    if (!isStorageAvailable()) return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isValidIdentity(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const persistIdentity = (identity: SystemIdentity): void => {
    if (!isStorageAvailable()) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    } catch {
        return;
    }
};

const generateIdentity = (): SystemIdentity => {
    const template = pick(OS_PROFILE_TEMPLATES);
    return {
        hostname: pick(HOSTNAMES),
        hostModel: pick(HOST_MODELS),
        osProfile: {
            os: template.os,
            shell: template.shell,
            kernel: template.kernel(),
        },
        resolution: pick(RESOLUTIONS),
        cpu: generateCpu(),
        gpu: pick(GPUS),
        memory: generateMemory(),
        disk: generateDisk(),
    };
};

const getSystemIdentity = (): SystemIdentity => {
    const persisted = loadPersistedIdentity();
    if (persisted) return persisted;

    const generated = generateIdentity();
    persistIdentity(generated);
    return generated;
};

export const getHostname = (): string => getSystemIdentity().hostname;

export const getHostModel = (): string => getSystemIdentity().hostModel;

export const getOsProfile = (): OsProfile => getSystemIdentity().osProfile;

export const getResolution = (): string => getSystemIdentity().resolution;

export const getCpu = (): string => getSystemIdentity().cpu;

export const getGpu = (): string => getSystemIdentity().gpu;

export const getMemory = (): string => getSystemIdentity().memory;

export const getDisk = (): string => getSystemIdentity().disk;

export const resetSystemIdentity = (): void => {
    if (!isStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEY);
};
