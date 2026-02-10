/**
 * @description Validation utilities for various fields.
 */

export const validateLogin = (value: string): string => {
    if (!value.trim()) return 'Login is required';
    if (value.length < 3) return 'Login must be at least 3 characters';
    if (value.length > 50) return 'Login must be at most 50 characters';
    return '';
};

export const validateUsername = (value: string): string => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 22) return 'Username must be at most 22 characters';
    if (!/^[a-zA-Z0-9_]/.test(value))
        return 'Username must start with a letter, number, or underscore';
    if (!/^[a-zA-Z0-9_.-]+$/.test(value))
        return 'Username can only contain letters, numbers, underscores, hyphens, and dots';
    if (value.includes('..')) return 'Username cannot contain consecutive dots';
    return '';
};

export const validatePassword = (value: string): string => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    if (value.length > 100) return 'Password must be at most 100 characters';
    return '';
};

export const validateInviteToken = (value: string): string => {
    if (!value.trim()) return 'Invite token is required';
    if (value.length > 100) return 'Invite token is too long';
    return '';
};
