import type {
    AuthenticationResponseJSON,
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
} from '@simplewebauthn/browser';

export interface PasskeyCredentialSummary {
    id: string;
    name: string;
    deviceType: 'singleDevice' | 'multiDevice';
    transports?: string[];
    createdAt: string;
    lastUsedAt: string | null;
}

export interface PasskeyListResponse {
    passkeys: PasskeyCredentialSummary[];
}

export interface PasskeyRegistrationOptionsResponse {
    options: PublicKeyCredentialCreationOptionsJSON;
}

export interface PasskeyRegistrationVerifyRequest {
    credential: RegistrationResponseJSON;
    name?: string;
}

export interface PasskeyRegistrationVerifyResponse {
    passkey: PasskeyCredentialSummary;
}

export interface PasskeyAuthenticationOptionsResponse {
    flowId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
}

export interface PasskeyAuthenticationVerifyRequest {
    flowId: string;
    credential: AuthenticationResponseJSON;
}

export interface PasskeyLoginResponse {
    token?: string;
    username: string;
}

export interface RenamePasskeyRequest {
    name: string;
}

export interface PasskeyDeleteResponse {
    message: string;
}
