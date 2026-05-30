/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { BotPermissionsDTO } from './BotPermissionsDTO';

export type BotPublicInfoResponseDTO = {
    clientId: string;
    username: string;
    displayName?: string;
    bio?: string;
    profilePicture?: string;
    banner?: string;
    usernameGradient?: string;
    botPermissions: BotPermissionsDTO;
    serverCount: number;
};
