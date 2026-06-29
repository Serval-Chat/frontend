import { describe, expect, it } from 'vitest';

import { applySedCommand, isSedCommand } from './sed';

describe('sed utilities', () => {
    describe('isSedCommand', () => {
        it('should return true for valid sed commands', () => {
            expect(isSedCommand('s/foo/bar/')).toBe(true);
            expect(isSedCommand('s/foo/bar')).toBe(true);
            expect(isSedCommand('s/foo/bar/g')).toBe(true);
            expect(isSedCommand('s/foo/bar/gi')).toBe(true);
            expect(isSedCommand('s/foo/bar/ig')).toBe(true);
            expect(isSedCommand('s/foo//')).toBe(true);
            expect(isSedCommand('s/foo//g')).toBe(true);
            expect(isSedCommand('s/foo\\/baz/bar/')).toBe(true);
        });

        it('should distinguish s/foo/ (valid, empty replacement) from s/foo (invalid, no second delimiter)', () => {
            expect(isSedCommand('s/foo/')).toBe(true);
            expect(isSedCommand('s/foo')).toBe(false);
        });

        it('should return false for invalid sed commands', () => {
            expect(isSedCommand('s//bar/')).toBe(false);
            expect(isSedCommand('/foo/bar/')).toBe(false);
            expect(isSedCommand('s/foo/bar/xyz')).toBe(false);
            expect(isSedCommand('hello s/foo/bar/')).toBe(false);
            expect(isSedCommand('s/foo')).toBe(false);
        });
    });

    describe('applySedCommand', () => {
        it('should replace first occurrence without modifiers', () => {
            expect(
                applySedCommand('hello world world', 's/world/universe/'),
            ).toBe('hello universe world');
        });

        it('should replace all occurrences with g modifier', () => {
            expect(
                applySedCommand('hello world world', 's/world/universe/g'),
            ).toBe('hello universe universe');
        });

        it('should be case-sensitive by default', () => {
            expect(applySedCommand('hello World', 's/world/universe/')).toBe(
                'hello World',
            );
        });

        it('should be case-insensitive with i modifier', () => {
            expect(applySedCommand('hello World', 's/world/universe/i')).toBe(
                'hello universe',
            );
        });

        it('should handle both g and i modifiers', () => {
            expect(applySedCommand('World world', 's/world/universe/gi')).toBe(
                'universe universe',
            );
        });

        it('should support regular expressions in search', () => {
            expect(applySedCommand('abc 123 def', 's/\\d+/numbers/')).toBe(
                'abc numbers def',
            );
        });

        it('should fallback to original message if regex is invalid', () => {
            expect(applySedCommand('hello', 's/[/bar/')).toBe('hello');
        });

        it('should handle escaped slashes in search and replacement', () => {
            expect(applySedCommand('hello/world', 's/\\//-/')).toBe(
                'hello-world',
            );
        });

        it('should handle multiple escaped slashes (e.g. paths) in search', () => {
            expect(
                applySedCommand(
                    '/bin/bash',
                    's/\\/bin\\/bash/\\/usr\\/bin\\/zsh/',
                ),
            ).toBe('/usr/bin/zsh');
        });

        it('should work with commands without trailing slash', () => {
            expect(applySedCommand('hello world', 's/world/universe')).toBe(
                'hello universe',
            );
        });

        it('should treat $& in replacement as a literal, not a back-reference', () => {
            expect(applySedCommand('hello world', 's/world/$&$&/')).toBe(
                'hello $&$&',
            );
        });

        it('should treat $1 in replacement as a literal, not a capture group reference', () => {
            expect(applySedCommand('hello world', 's/world/$1/')).toBe(
                'hello $1',
            );
        });

        it('should note that search uses regex, so . matches any character', () => {
            expect(applySedCommand('version 1X0', 's/1.0/2.0/')).toBe(
                'version 2.0',
            );
            expect(applySedCommand('version 1.0', 's/1.0/2.0/')).toBe(
                'version 2.0',
            );
        });
    });
});
