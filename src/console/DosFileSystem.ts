export type DosAttribute = 'A' | 'H' | 'R' | 'S';

const VALID_DOS_ATTRIBUTES = new Set<DosAttribute>(['A', 'H', 'R', 'S']);

export interface DosEntry {
    attributes: DosAttribute[];
    content?: string;
    createdAt: string;
    modifiedAt: string;
    name: string;
    path: string;
    type: 'directory' | 'file';
}

interface StoredFileSystem {
    cwd: string;
    entries: Record<string, DosEntry>;
}

const STORAGE_KEY = 'serchat.console.filesystem.v1';
const DRIVE = 'C:';
const ROOT = `${DRIVE}\\`;
const VALID_83 =
    /^[A-Z0-9_$~!#%&{}@'`()^-]{1,8}(?:\.[A-Z0-9_$~!#%&{}@'`()^-]{1,3})?$/;

const now = (): string => new Date().toISOString();

const isStorageAvailable = (): boolean => typeof localStorage !== 'undefined';

const formatName = (name: string): string => name.toUpperCase();

export class DosFileSystem {
    private cwd = ROOT;
    private entries: Record<string, DosEntry> = {};

    public constructor() {
        this.load();
    }

    public getCwd(): string {
        return this.cwd;
    }

    public changeDirectory(target?: string): string {
        if (!target) return this.cwd;

        const resolved = this.resolvePath(target, { allowMissingLeaf: false });
        const entry = this.entries[resolved];
        if (entry?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }

        this.cwd = resolved;
        this.save();
        return this.cwd;
    }

    public list(pathPattern?: string): DosEntry[] {
        const pattern = pathPattern || '*';
        const resolved = this.resolvePattern(pattern);
        const directory = this.entries[resolved.directory];
        if (directory?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }

        return Object.values(this.entries)
            .filter(
                (entry): boolean =>
                    entry.path !== resolved.directory &&
                    this.parentPath(entry.path) === resolved.directory &&
                    this.matchesPattern(entry.name, resolved.pattern),
            )
            .sort((a, b): number => {
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
    }

    public makeDirectory(path: string): DosEntry {
        const resolved = this.resolvePath(path, { allowMissingLeaf: true });
        this.assertValidLeaf(resolved);

        if (this.entries[resolved]) {
            throw new Error('A subdirectory or file already exists.');
        }

        const parent = this.parentPath(resolved);
        if (this.entries[parent]?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }

        const entry = this.createEntry(resolved, 'directory');
        this.entries[resolved] = entry;
        this.save();
        return entry;
    }

    public removeDirectory(path: string): void {
        const resolved = this.resolvePath(path, { allowMissingLeaf: false });
        const entry = this.entries[resolved];
        if (entry?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }
        if (resolved === ROOT) {
            throw new Error(
                'The process cannot access the file because it is in use.',
            );
        }
        if (this.hasChildren(resolved)) {
            throw new Error('The directory is not empty.');
        }

        delete this.entries[resolved];
        if (this.cwd === resolved || this.cwd.startsWith(`${resolved}\\`)) {
            this.cwd = this.parentPath(resolved);
        }
        this.save();
    }

    public copy(source: string, destination: string): DosEntry {
        const sourcePath = this.resolvePath(source, {
            allowMissingLeaf: false,
        });
        const sourceEntry = this.entries[sourcePath];
        if (sourceEntry?.type !== 'file') {
            throw new Error('File not found.');
        }

        const destinationPath = this.resolveDestination(
            destination,
            sourceEntry.name,
        );
        this.assertValidLeaf(destinationPath);
        const parent = this.parentPath(destinationPath);
        if (this.entries[parent]?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }

        const entry: DosEntry = {
            ...sourceEntry,
            attributes: [...sourceEntry.attributes],
            createdAt: this.entries[destinationPath]?.createdAt ?? now(),
            modifiedAt: now(),
            name: this.leafName(destinationPath),
            path: destinationPath,
        };
        this.entries[destinationPath] = entry;
        this.save();
        return entry;
    }

    public move(source: string, destination: string): DosEntry {
        const sourcePath = this.resolvePath(source, {
            allowMissingLeaf: false,
        });
        const entry = this.entries[sourcePath];
        if (!entry) throw new Error('File not found.');

        const destinationPath = this.resolveDestination(
            destination,
            entry.name,
        );
        return this.renameResolved(sourcePath, destinationPath);
    }

    public rename(source: string, destinationName: string): DosEntry {
        const sourcePath = this.resolvePath(source, {
            allowMissingLeaf: false,
        });
        const destinationPath = this.resolvePath(destinationName, {
            allowMissingLeaf: true,
            baseDirectory: this.parentPath(sourcePath),
        });
        return this.renameResolved(sourcePath, destinationPath);
    }

    public delete(pathPattern: string): number {
        const resolved = this.resolvePattern(pathPattern);
        const entries = this.list(pathPattern).filter(
            (entry): boolean => entry.type === 'file',
        );
        for (const entry of entries) {
            if (entry.attributes.includes('R')) {
                throw new Error('Access is denied.');
            }
            delete this.entries[entry.path];
        }

        if (entries.length === 0 && !this.hasWildcard(resolved.pattern)) {
            throw new Error('Could Not Find ' + this.displayPath(pathPattern));
        }

        this.save();
        return entries.length;
    }

    public readFile(path: string): string {
        const resolved = this.resolvePath(path, { allowMissingLeaf: false });
        const entry = this.entries[resolved];
        if (entry?.type !== 'file') {
            throw new Error('The system cannot find the file specified.');
        }
        return entry.content ?? '';
    }

    public setAttributes(pathPattern: string, changes: string[]): DosEntry[] {
        const entries = this.list(pathPattern);
        if (entries.length === 0) {
            throw new Error('File not found.');
        }

        if (changes.length === 0) return entries;

        for (const entry of entries) {
            const attributes = new Set(entry.attributes);
            for (const change of changes) {
                const op = change[0];
                const attribute = change[1]?.toUpperCase() as DosAttribute;
                if (
                    (op !== '+' && op !== '-') ||
                    !VALID_DOS_ATTRIBUTES.has(attribute)
                ) {
                    throw new Error('Invalid parameter - ' + change);
                }
                if (op === '+') attributes.add(attribute);
                else attributes.delete(attribute);
            }
            entry.attributes = [...attributes].toSorted();
            entry.modifiedAt = now();
        }
        this.save();
        return entries;
    }

    public writeFile(path: string, content: string): DosEntry {
        const resolved = this.resolvePath(path, { allowMissingLeaf: true });
        this.assertValidLeaf(resolved);
        const parent = this.parentPath(resolved);
        if (this.entries[parent]?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }
        if (this.entries[resolved]?.attributes.includes('R')) {
            throw new Error('Access is denied.');
        }

        const entry: DosEntry = {
            attributes: this.entries[resolved]?.attributes ?? ['A'],
            content,
            createdAt: this.entries[resolved]?.createdAt ?? now(),
            modifiedAt: now(),
            name: this.leafName(resolved),
            path: resolved,
            type: 'file',
        };
        this.entries[resolved] = entry;
        this.save();
        return entry;
    }

    private load(): void {
        if (isStorageAvailable()) {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as StoredFileSystem;
                    this.cwd = parsed.cwd || ROOT;
                    this.entries = parsed.entries || {};
                    if (this.entries[ROOT]) return;
                } catch {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }

        const root = this.createEntry(ROOT, 'directory');
        this.entries = { [ROOT]: root };
        this.cwd = ROOT;
        this.writeFile(
            'README.TXT',
            'Serchat Console filesystem.\nUse DIR to list files.\n',
        );
        this.save();
    }

    private save(): void {
        if (!isStorageAvailable()) return;
        const stored: StoredFileSystem = {
            cwd: this.cwd,
            entries: this.entries,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }

    private resolveDestination(
        destination: string,
        sourceName: string,
    ): string {
        const resolved = this.resolvePath(destination, {
            allowMissingLeaf: true,
        });
        const existing = this.entries[resolved];
        if (existing?.type === 'directory') {
            return this.joinPath(resolved, sourceName);
        }
        return resolved;
    }

    private renameResolved(
        sourcePath: string,
        destinationPath: string,
    ): DosEntry {
        const entry = this.entries[sourcePath];
        if (!entry) throw new Error('File not found.');
        this.assertValidLeaf(destinationPath);
        if (this.entries[destinationPath]) {
            throw new Error(
                'A duplicate file name exists, or the file cannot be found.',
            );
        }
        const parent = this.parentPath(destinationPath);
        if (this.entries[parent]?.type !== 'directory') {
            throw new Error('The system cannot find the path specified.');
        }

        const moved: DosEntry = {
            ...entry,
            modifiedAt: now(),
            name: this.leafName(destinationPath),
            path: destinationPath,
        };
        delete this.entries[sourcePath];
        this.entries[destinationPath] = moved;
        this.save();
        return moved;
    }

    private resolvePattern(input: string): {
        directory: string;
        pattern: string;
    } {
        const normalized = input.trim() || '*';
        const hasSlash = /[\\/]/.test(normalized);
        const directoryInput = hasSlash
            ? normalized.replace(/[\\/][^\\/]*$/, '') || '\\'
            : '.';
        const pattern = formatName(
            hasSlash ? normalized.split(/[\\/]/).pop() || '*' : normalized,
        );
        const directory = this.resolvePath(directoryInput, {
            allowMissingLeaf: false,
        });
        return { directory, pattern };
    }

    private resolvePath(
        input: string,
        options: { allowMissingLeaf: boolean; baseDirectory?: string },
    ): string {
        const base = options.baseDirectory ?? this.cwd;
        const raw = input.trim();
        if (!raw || raw === '.') return base;

        let working = raw.replaceAll('/', '\\');
        if (/^[A-Za-z]:/.test(working)) {
            working = working.slice(2);
        }

        const absolute = working.startsWith('\\');
        const parts = (absolute ? working.slice(1) : working)
            .split('\\')
            .filter(Boolean);
        const stack = absolute ? [] : this.pathParts(base);

        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                stack.pop();
                continue;
            }
            stack.push(formatName(part));
        }

        const resolved = this.pathFromParts(stack);
        if (!options.allowMissingLeaf && !this.entries[resolved]) {
            throw new Error('The system cannot find the path specified.');
        }
        return resolved;
    }

    private assertValidLeaf(path: string): void {
        const leaf = this.leafName(path);
        if (!VALID_83.test(leaf)) {
            throw new Error(
                'The filename, directory name, or volume label syntax is incorrect.',
            );
        }
    }

    private createEntry(path: string, type: DosEntry['type']): DosEntry {
        return {
            attributes: type === 'file' ? ['A'] : [],
            createdAt: now(),
            modifiedAt: now(),
            name: path === ROOT ? '' : this.leafName(path),
            path,
            type,
        };
    }

    private hasChildren(path: string): boolean {
        return Object.values(this.entries).some(
            (entry): boolean => this.parentPath(entry.path) === path,
        );
    }

    private matchesPattern(name: string, pattern: string): boolean {
        if (pattern === '*.*') return true;
        const escaped = pattern
            .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`)
            .replaceAll('*', '.*')
            .replaceAll('?', '.');
        return new RegExp(`^${escaped}$`, 'i').test(name);
    }

    private hasWildcard(value: string): boolean {
        return value.includes('*') || value.includes('?');
    }

    private pathParts(path: string): string[] {
        return path
            .replace(/^C:\\?/, '')
            .split('\\')
            .filter(Boolean);
    }

    private pathFromParts(parts: string[]): string {
        return parts.length === 0 ? ROOT : `${DRIVE}\\${parts.join('\\')}`;
    }

    private joinPath(directory: string, leaf: string): string {
        return directory === ROOT ? `${ROOT}${leaf}` : `${directory}\\${leaf}`;
    }

    private parentPath(path: string): string {
        if (path === ROOT) return ROOT;
        const parts = this.pathParts(path);
        parts.pop();
        return this.pathFromParts(parts);
    }

    private leafName(path: string): string {
        return path.split('\\').findLast(Boolean)?.toUpperCase() ?? '';
    }

    private displayPath(path: string): string {
        return path.replaceAll('/', '\\').toUpperCase();
    }
}
