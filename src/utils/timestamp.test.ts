import { describe, expect, it, vi } from 'vitest';

import {
    formatDateSeparator,
    formatTimestamp,
    isSameDay,
    shouldGroupMessages,
} from './timestamp';

describe('timestamp utils', (): void => {
    describe('formatTimestamp', (): void => {
        const now = new Date('2024-03-20T12:00:00Z');

        it('formats today timestamp correctly', (): void => {
            vi.setSystemTime(now);
            const today = '2024-03-20T10:30:00Z';
            expect(formatTimestamp(today)).toMatch(/Today at/);
        });

        it('formats yesterday timestamp correctly', (): void => {
            vi.setSystemTime(now);
            const yesterday = '2024-03-19T10:30:00Z';
            expect(formatTimestamp(yesterday)).toMatch(/Yesterday at/);
        });

        it('formats last week timestamp correctly', (): void => {
            vi.setSystemTime(now);
            const fewDaysAgo = '2024-03-17T10:30:00Z';
            // Sunday
            expect(formatTimestamp(fewDaysAgo)).toMatch(/Sunday at/);
        });

        it('formats older timestamp correctly', (): void => {
            vi.setSystemTime(now);
            const lastYear = '2023-03-20T10:30:00Z';
            // Should include year if different from current year
            expect(formatTimestamp(lastYear)).toContain('2023');
        });
    });

    describe('shouldGroupMessages', (): void => {
        const userA = { id: 'user1', username: 'alice' };
        const userB = { id: 'user2', username: 'bob' };

        it('returns true for same user within 5 minutes', (): void => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:04:59Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(true);
        });

        it('returns false for same user older than 5 minutes', (): void => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:05:01Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(false);
        });

        it('returns false for different users within 5 minutes', (): void => {
            const msg1 = { user: userA, createdAt: '2024-03-20T12:00:00Z' };
            const msg2 = { user: userB, createdAt: '2024-03-20T12:01:00Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(false);
        });

        it('handles senderId correctly', (): void => {
            const msg1 = {
                senderId: 'user1',
                createdAt: '2024-03-20T12:00:00Z',
            };
            const msg2 = { user: userA, createdAt: '2024-03-20T12:01:00Z' };
            expect(shouldGroupMessages(msg1, msg2)).toBe(true);
        });
    });

    describe('isSameDay', (): void => {
        it('returns true for timestamps on the same calendar day', (): void => {
            expect(
                isSameDay(
                    '2024-03-20T09:00:00Z',
                    '2024-03-20T15:00:00Z',
                ),
            ).toBe(true);
        });

        it('returns false for timestamps on different calendar days', (): void => {
            expect(
                isSameDay(
                    '2024-03-20T12:00:00Z',
                    '2024-03-21T12:00:00Z',
                ),
            ).toBe(false);
        });
    });

    describe('formatDateSeparator', (): void => {
        const now = new Date('2024-03-20T12:00:00Z');

        it('formats today as "Today"', (): void => {
            vi.setSystemTime(now);
            expect(formatDateSeparator('2024-03-20T10:30:00Z')).toBe(
                'Today',
            );
        });

        it('formats yesterday as "Yesterday"', (): void => {
            vi.setSystemTime(now);
            expect(formatDateSeparator('2024-03-19T10:30:00Z')).toBe(
                'Yesterday',
            );
        });

        it('formats a few days ago as the weekday name', (): void => {
            vi.setSystemTime(now);
            // 2024-03-17 is a Sunday
            expect(formatDateSeparator('2024-03-17T10:30:00Z')).toBe(
                'Sunday',
            );
        });

        it('always includes the year for dates 7+ days old, even in the current year', (): void => {
            vi.setSystemTime(now);
            expect(formatDateSeparator('2024-02-01T10:30:00Z')).toBe(
                'Feb 1, 2024',
            );
        });

        it('includes the year for dates from a previous year', (): void => {
            vi.setSystemTime(now);
            expect(formatDateSeparator('2023-03-20T10:30:00Z')).toBe(
                'Mar 20, 2023',
            );
        });
    });
});
