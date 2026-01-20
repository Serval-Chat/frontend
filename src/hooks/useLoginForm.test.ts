import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { authApi } from '@/api/auth/auth.api';

import { useLoginForm } from './useLoginForm';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@/api/auth/auth.api', () => ({
    authApi: {
        login: vi.fn(),
    },
}));

vi.mock('@/utils/authToken', () => ({
    setAuthToken: vi.fn(),
}));

describe('useLoginForm', () => {
    it('should initialize with empty values', () => {
        const { result } = renderHook(() => useLoginForm());
        expect(result.current.loginInput).toBe('');
        expect(result.current.password).toBe('');
        expect(result.current.status).toEqual({ message: '', type: '' });
    });

    it('should show error if fields are empty', async () => {
        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.status).toEqual({
            message: 'Please fill in all fields.',
            type: 'error',
        });
    });

    it('should handle successful login', async () => {
        const { result } = renderHook(() => useLoginForm());
        vi.mocked(authApi.login).mockResolvedValue({ token: 'fake-token' });

        await act(async () => {
            result.current.setLoginInput('testuser');
            result.current.setPassword('password123');
        });

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(authApi.login).toHaveBeenCalledWith({
            login: 'testuser',
            password: 'password123',
        });
        expect(result.current.status.type).not.toBe('error');
    });

    it('should handle login error', async () => {
        const { result } = renderHook(() => useLoginForm());
        vi.mocked(authApi.login).mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Invalid credentials' } },
        });

        await act(async () => {
            result.current.setLoginInput('testuser');
            result.current.setPassword('wrongpass');
        });

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent<HTMLFormElement>);
        });

        expect(result.current.status).toEqual({
            message: 'Invalid credentials',
            type: 'error',
        });
    });
});
