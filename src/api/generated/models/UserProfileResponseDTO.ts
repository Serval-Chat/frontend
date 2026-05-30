/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActiveMuteResponseDTO } from './ActiveMuteResponseDTO';
import type { BadgeResponseDTO } from './BadgeResponseDTO';
import type { UserConnectionResponseDTO } from './UserConnectionResponseDTO';
import type { UserSettingsDTO } from './UserSettingsDTO';
import type { UsernameGlowDTO } from './UsernameGlowDTO';
import type { UsernameGradientDTO } from './UsernameGradientDTO';

export type UserProfileResponseDTO = {
    id: string;
    username: string;
    displayName: Record<string, any> | null;
    profilePicture: Record<string, any> | null;
    usernameFont?: UserProfileResponseDTO.usernameFont;
    usernameGradient?: UsernameGradientDTO;
    usernameGlow?: UsernameGlowDTO;
    customStatus: Record<string, any> | null;
    permissions?: Record<string, any>;
    createdAt: string;
    bio?: string;
    pronouns?: string;
    badges: Array<BadgeResponseDTO>;
    banner: Record<string, any> | null;
    serverSettings?: Record<string, any>;
    settings?: UserSettingsDTO;
    connections?: Array<UserConnectionResponseDTO>;
    activeMute?: ActiveMuteResponseDTO | null;
};
export namespace UserProfileResponseDTO {
    export enum usernameFont {
        DEFAULT = 'default',
        AUDIOWIDE = 'Audiowide',
        BEBAS_NEUE = 'Bebas Neue',
        BETANIA_PATMOS = 'Betania Patmos',
        GOOGLE_SANS_CODE = 'Google Sans Code',
        NOTO_SANS = 'Noto Sans',
        PACIFICO = 'Pacifico',
        PLAYPEN_SANS_DEVA = 'Playpen Sans Deva',
        RAMPART_ONE = 'Rampart One',
        ROBOTO = 'Roboto',
        WORKBENCH = 'Workbench',
    }
}
