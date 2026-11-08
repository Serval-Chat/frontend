import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RolePermissions } from '@/api/servers/servers.types';

import { useMessageModerationPermissions } from './Message.hooks';

const hasPermissionFrom =
    (granted: (keyof RolePermissions)[]) =>
    (perm: keyof RolePermissions): boolean =>
        granted.includes(perm);

describe('useMessageModerationPermissions', (): void => {
    it('grants everything to the server owner regardless of roles/position', (): void => {
        const { result } = renderHook(() =>
            useMessageModerationPermissions(true, hasPermissionFrom([]), -1, 5),
        );

        expect(result.current).toEqual({
            canBan: true,
            canKick: true,
            canTimeout: true,
            isHigherHierarchy: true,
        });
    });

    it('denies moderation actions when the user has no relevant permission and is not the owner', (): void => {
        const { result } = renderHook(() =>
            useMessageModerationPermissions(false, hasPermissionFrom([]), 0, 0),
        );

        expect(result.current.canBan).toBe(false);
        expect(result.current.canKick).toBe(false);
        expect(result.current.canTimeout).toBe(false);
    });

    it('grants each action independently based on its specific permission', (): void => {
        const { result: banResult } = renderHook(() =>
            useMessageModerationPermissions(
                false,
                hasPermissionFrom(['banMembers']),
                0,
                0,
            ),
        );
        expect(banResult.current.canBan).toBe(true);
        expect(banResult.current.canKick).toBe(false);
        expect(banResult.current.canTimeout).toBe(false);

        const { result: kickResult } = renderHook(() =>
            useMessageModerationPermissions(
                false,
                hasPermissionFrom(['kickMembers']),
                0,
                0,
            ),
        );
        expect(kickResult.current.canKick).toBe(true);
        expect(kickResult.current.canBan).toBe(false);

        const { result: timeoutResult } = renderHook(() =>
            useMessageModerationPermissions(
                false,
                hasPermissionFrom(['moderateMembers']),
                0,
                0,
            ),
        );
        expect(timeoutResult.current.canTimeout).toBe(true);
        expect(timeoutResult.current.canBan).toBe(false);
    });

    it('grants all three when the user has the administrator permission', (): void => {
        const { result } = renderHook(() =>
            useMessageModerationPermissions(
                false,
                hasPermissionFrom(['administrator']),
                0,
                0,
            ),
        );

        expect(result.current).toEqual({
            canBan: true,
            canKick: true,
            canTimeout: true,
            isHigherHierarchy: false,
        });
    });

    it('is higher hierarchy only when the current user outranks the target', (): void => {
        expect(
            renderHook(() =>
                useMessageModerationPermissions(
                    false,
                    hasPermissionFrom([]),
                    5,
                    3,
                ),
            ).result.current.isHigherHierarchy,
        ).toBe(true);

        expect(
            renderHook(() =>
                useMessageModerationPermissions(
                    false,
                    hasPermissionFrom([]),
                    3,
                    5,
                ),
            ).result.current.isHigherHierarchy,
        ).toBe(false);

        expect(
            renderHook(() =>
                useMessageModerationPermissions(
                    false,
                    hasPermissionFrom([]),
                    3,
                    3,
                ),
            ).result.current.isHigherHierarchy,
        ).toBe(false);
    });
});
