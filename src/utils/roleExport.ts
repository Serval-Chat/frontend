import type { Role, RolePermissions } from '@/api/servers/servers.types';

export interface ExportedRole {
    _v: 1;
    _type: 'role';
    name: string;
    color?: string | null;
    startColor?: string;
    endColor?: string;
    colors?: string[];
    gradientRepeat?: number;
    glowEnabled?: boolean;
    separateFromOtherRoles?: boolean;
    description?: string;
    permissions?: Partial<RolePermissions>;
}

export interface ExportedRoleEntry extends Omit<ExportedRole, '_v' | '_type'> {
    position: number;
}
export interface ExportedRoleList {
    _v: 1;
    _type: 'role-list';
    roles: ExportedRoleEntry[];
}

export type RoleExportPayload = ExportedRole | ExportedRoleList;

async function compress(data: string): Promise<Uint8Array> {
    const stream = new CompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    void writer.write(encoder.encode(data));
    void writer.close();
    const chunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

async function decompress(bytes: Uint8Array): Promise<string> {
    const stream = new DecompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    void writer.write(bytes);
    void writer.close();
    const chunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return new TextDecoder().decode(out);
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function pickRoleFields(role: Role): Omit<ExportedRole, '_v' | '_type'> {
    return {
        name: role.name,
        ...(role.color != null ? { color: role.color } : {}),
        ...(role.startColor ? { startColor: role.startColor } : {}),
        ...(role.endColor ? { endColor: role.endColor } : {}),
        ...(role.colors?.length ? { colors: role.colors } : {}),
        ...(role.gradientRepeat != null
            ? { gradientRepeat: role.gradientRepeat }
            : {}),
        ...(role.glowEnabled != null ? { glowEnabled: role.glowEnabled } : {}),
        ...(role.separateFromOtherRoles != null
            ? { separateFromOtherRoles: role.separateFromOtherRoles }
            : {}),
        ...(role.description ? { description: role.description } : {}),
        ...(role.permissions ? { permissions: role.permissions } : {}),
    };
}


export function isIgnoredRole(role: Role): boolean {
    return Boolean(
        role.isBot ||
        role.managed ||
        role.name === '@everyone' ||
        role.name?.toLowerCase() === 'everyone' ||
        role.position === 0,
    );
}

export function isBotRole(role: Role): boolean {
    return isIgnoredRole(role);
}

export async function exportRole(role: Role): Promise<string> {
    if (isIgnoredRole(role)) {
        throw new Error('Default or bot roles cannot be exported.');
    }
    const payload: ExportedRole = {
        _v: 1,
        _type: 'role',
        ...pickRoleFields(role),
    };
    const compressed = await compress(JSON.stringify(payload));
    return uint8ToBase64(compressed);
}

export async function exportRoleList(roles: Role[]): Promise<string> {
    const userRoles = roles.filter((role) => !isIgnoredRole(role));
    const payload: ExportedRoleList = {
        _v: 1,
        _type: 'role-list',
        roles: userRoles.map(
            (role, idx): ExportedRoleEntry => ({
                position: userRoles.length - idx,
                ...pickRoleFields(role),
            }),
        ),
    };
    const compressed = await compress(JSON.stringify(payload));
    return uint8ToBase64(compressed);
}

export async function importRolePayload(
    code: string,
): Promise<RoleExportPayload> {
    let json: string;
    try {
        json = await decompress(base64ToUint8(code.trim()));
    } catch {
        throw new Error('Invalid role code: could not decode or decompress.');
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error('Invalid role code: not valid JSON after decompression.');
    }
    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('_v' in parsed) ||
        !('_type' in parsed)
    ) {
        throw new Error('Invalid role code: missing version or type marker.');
    }
    const p = parsed as Record<string, unknown>;
    if (p['_v'] !== 1) {
        throw new Error(
            `Unsupported role code version: ${String(p['_v'])}. Please update the app.`,
        );
    }
    if (p['_type'] !== 'role' && p['_type'] !== 'role-list') {
        throw new Error(
            `Unknown role code type: ${String(p['_type'])}. Expected 'role' or 'role-list'.`,
        );
    }
    return parsed as RoleExportPayload;
}
