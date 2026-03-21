export interface LoginRequest {
    login: string;
    password: string;
}

export interface LoginResponse {
    token?: string;
    temp_token?: string;
    two_factor_required?: boolean;
    username: string;
}

export interface VerifyTwoFactorRequest {
    tempToken: string;
    code?: string;
    backupCode?: string;
}

export interface TotpSetupResponse {
    otpauthUri: string;
}

export interface TotpSetupConfirmRequest {
    code: string;
}

export interface TotpSetupConfirmResponse {
    backupCodes: string[];
}

export interface TotpSensitiveActionRequest {
    code?: string;
    backupCode?: string;
}

export interface RegisterRequest {
    login: string;
    username: string;
    password: string;
    invite: string;
}

export interface RegisterResponse {
    token: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
    token: string;
}

export interface ChangeLoginRequest {
    newLogin: string;
    password: string;
}

export interface ChangeLoginResponse {
    message: string;
    login: string;
    token: string;
}

export interface RequestPasswordResetRequest {
    email: string;
}

export interface RequestPasswordResetResponse {
    message: string;
    requestId: string;
}

export interface ConfirmPasswordResetRequest {
    token: string;
    newPassword: string;
}

export interface ConfirmPasswordResetResponse {
    message: string;
    requestId: string;
}
