import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFileQueue } from './useFileQueue';

describe('useFileQueue', () => {
    it('should start with an empty queue', () => {
        const { result } = renderHook(() => useFileQueue());
        expect(result.current.files).toEqual([]);
    });

    it('should add files with initial status and progress', () => {
        const { result } = renderHook(() => useFileQueue());
        const file1 = new File(['content1'], 'file1.txt', {
            type: 'text/plain',
        });

        act(() => {
            result.current.addFiles([file1]);
        });

        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0].file).toBe(file1);
        expect(result.current.files[0].status).toBe('idle');
        expect(result.current.files[0].progress).toBe(0);
    });

    it('should update file status', () => {
        const { result } = renderHook(() => useFileQueue());
        const file = new File(['content'], 'file.txt', { type: 'text/plain' });

        act(() => {
            result.current.addFiles([file]);
        });

        const id = result.current.files[0].id;

        act(() => {
            result.current.updateFileStatus(id, 'uploading');
        });

        expect(result.current.files[0].status).toBe('uploading');
    });

    it('should update file progress', () => {
        const { result } = renderHook(() => useFileQueue());
        const file = new File(['content'], 'file.txt', { type: 'text/plain' });

        act(() => {
            result.current.addFiles([file]);
        });

        const id = result.current.files[0].id;

        act(() => {
            result.current.updateFileProgress(id, 50);
        });

        expect(result.current.files[0].progress).toBe(50);
    });

    it('should toggle spoiler status', () => {
        const { result } = renderHook(() => useFileQueue());
        const file = new File(['content'], 'file.txt', { type: 'text/plain' });

        act(() => {
            result.current.addFiles([file]);
        });

        const id = result.current.files[0].id;

        act(() => {
            result.current.toggleSpoiler(id);
        });

        expect(result.current.files[0].isSpoiler).toBe(true);
    });

    it('should remove a file from the queue', () => {
        const { result } = renderHook(() => useFileQueue());
        const file = new File(['content'], 'file.txt', { type: 'text/plain' });

        act(() => {
            result.current.addFiles([file]);
        });

        const id = result.current.files[0].id;

        act(() => {
            result.current.removeFile(id);
        });

        expect(result.current.files).toHaveLength(0);
    });

    it('should clear the queue', () => {
        const { result } = renderHook(() => useFileQueue());
        act(() => {
            result.current.addFiles([new File([''], '1.txt')]);
            result.current.clearQueue();
        });
        expect(result.current.files).toHaveLength(0);
    });
});
