import type {
    AuthenticationResponseJSON,
    PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

export interface EnablePasswordlessRequest {
    password: string;
}

export interface EnablePasswordlessResponse {
    recoveryKeys: string[];
    token: string;
}

export interface RegenerateRecoveryKeysOptionsResponse {
    flowId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
}

export interface RegenerateRecoveryKeysVerifyRequest {
    flowId: string;
    credential: AuthenticationResponseJSON;
}

export interface RegenerateRecoveryKeysVerifyResponse {
    recoveryKeys: string[];
}

export interface RecoveryKeyLoginRequest {
    login: string;
    recoveryKey: string;
    cfTurnstileResponse: string;
}

export interface RecoveryKeyLoginResponse {
    token?: string;
    username: string;
}
