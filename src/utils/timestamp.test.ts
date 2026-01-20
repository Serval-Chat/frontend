import { describe, expect, it, vi } from 'vitest';

import { formatTimestamp, shouldGroupMessages } from './timestamp';

describe('timestamp utils', () => {
    describe('formatTimestamp', () => {
        const now = new Date('2024-03-20T12:00:00Z');

        it('formats today timestamp correctly', () => {
            vi.setSystemTime(now);
            const today = '2024-03-20T10:30:00Z';
            expect(formatTimestamp(today)).toMatch(/Today at/);
        });

        it('formats yesterday timestamp correctly', () => {
            vi.setSystemTime(now);
            const yesterday = '2024-03-19T10:30:00Z';
            expect(formatTimestamp(yesterday)).toMatch(/Yesterday at/);
        });

        it('formats last week timestamp correctly', () => {
            vi.setSystemTime(now);
            const fewDaysAgo = '2024-03-17T10:30:00Z';
            // Sunday
            expect(formatTimestamp(fewDaysAgo)).toMatch(/Sunday at/);
        });

        it('formats older timestamp correctly', () => {
            vi.setSystemTime(now);
            const lastYear = '2023-03-20T10:30:00Z';
            // Should include year if different from current year
            expect(formatTimestamp(lastYear)).toContain('2023');
        });
    });

    describe('shouldGroupMessages', () => {
        const userA = { _id: 'user1', username: 'alice' };
        const userB = { _id: 'user2', username: 'bob' };

        it('returns true for same user within 5 minutes', () => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:04:59Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(true);
        });

        it('returns false for same user older than 5 minutes', () => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:05:01Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(false);
        });

        it('returns false for different users within 5 minutes', () => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userB, createdAt: '2024-03-20T12:01:00Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(false);
        });

        it('handles senderId correctly', () => {
            const msg1 = {
                senderId: 'user1',
                createdAt: '2024-03-20T12:00:00Z',
            };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:01:00Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(true);
        });
    });
});
