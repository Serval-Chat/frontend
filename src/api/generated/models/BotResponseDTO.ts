/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { BotPermissionsDTO } from './BotPermissionsDTO';
import type { BotUserDTO } from './BotUserDTO';

export type BotResponseDTO = {
    id: string;
    clientId: string;
    ownerId: string;
    userId: BotUserDTO;
    botPermissions: BotPermissionsDTO;
    createdAt?: string;
};
