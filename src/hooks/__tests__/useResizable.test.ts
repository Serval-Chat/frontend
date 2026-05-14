import type React from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useResizable } from '@/hooks/useResizable';

describe('useResizable', () => {
    const defaultOptions = {
        initialWidth: 240,
        minWidth: 200,
        maxWidth: 400,
        storageKey: 'test-resizable',
        side: 'left' as const, // Component on left, dragging right edge
    };

    it('should initialize with initialWidth', () => {
        const { result } = renderHook(() => useResizable(defaultOptions));
        expect(result.current.width).toBe(240);
    });

    it('should respect minWidth and maxWidth on initialization', () => {
        localStorage.setItem('test-resizable', '500');
        const { result } = renderHook(() => useResizable(defaultOptions));
        expect(result.current.width).toBe(240); // Falls back to initialWidth
    });

    it('should initialize from localStorage if available and within bounds', () => {
        localStorage.setItem('test-resizable', '300');
        const { result } = renderHook(() => useResizable(defaultOptions));
        expect(result.current.width).toBe(300);
    });

    it('should update width on mouse move when resizing (side: left)', async () => {
        const { result } = renderHook(() =>
            useResizable({ ...defaultOptions, side: 'left' }),
        );

        act(() => {
            // Start at 240 width, mouse at 100
            result.current.handleMouseDown({
                preventDefault: vi.fn(),
                clientX: 100,
            } as any as React.MouseEvent);
        });

        act(() => {
            // Move mouse to 150 (delta +50)
            const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
            window.dispatchEvent(moveEvent);
        });

        // 240 + 50 = 290
        await waitFor(() => expect(result.current.width).toBe(290));
    });

    it('should update width on mouse move when resizing (side: right)', async () => {
        const { result } = renderHook(() =>
            useResizable({ ...defaultOptions, side: 'right' }),
        );

        act(() => {
            // Start at 240 width, mouse at 1000
            result.current.handleMouseDown({
                preventDefault: vi.fn(),
                clientX: 1000,
            } as any as React.MouseEvent);
        });

        act(() => {
            // Move mouse to 950 (delta -50)
            // side: 'right' -> newWidth = startWidth - delta = 240 - (-50) = 290
            const moveEvent = new MouseEvent('mousemove', { clientX: 950 });
            window.dispatchEvent(moveEvent);
        });

        await waitFor(() => expect(result.current.width).toBe(290));
    });

    it('should respect minWidth and maxWidth during resizing', async () => {
        const { result } = renderHook(() => useResizable(defaultOptions));

        act(() => {
            result.current.handleMouseDown({
                preventDefault: vi.fn(),
                clientX: 100,
            } as any as React.MouseEvent);
        });

        // Test minWidth (200)
        act(() => {
            const moveEvent = new MouseEvent('mousemove', { clientX: 50 });
            window.dispatchEvent(moveEvent);
        });
        await waitFor(() => expect(result.current.width).toBe(200));

        // Test maxWidth (400)
        act(() => {
            const moveEvent = new MouseEvent('mousemove', { clientX: 500 });
            window.dispatchEvent(moveEvent);
        });
        await waitFor(() => expect(result.current.width).toBe(400));
    });

    it('should save to localStorage ONLY on mouseup', async () => {
        const { result } = renderHook(() => useResizable(defaultOptions));

        act(() => {
            result.current.handleMouseDown({
                preventDefault: vi.fn(),
                clientX: 100,
            } as any as React.MouseEvent);
        });

        act(() => {
            const moveEvent = new MouseEvent('mousemove', { clientX: 150 });
            window.dispatchEvent(moveEvent);
        });

        expect(localStorage.getItem('test-resizable')).toBeNull();

        act(() => {
            const upEvent = new MouseEvent('mouseup');
            window.dispatchEvent(upEvent);
        });

        await waitFor(() =>
            expect(localStorage.getItem('test-resizable')).toBe('290'),
        );
    });
});
