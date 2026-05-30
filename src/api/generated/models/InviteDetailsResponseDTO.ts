/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { InviteServerDTO } from './InviteServerDTO';

export type InviteDetailsResponseDTO = {
    code: string;
    expiresAt?: string;
    maxUses?: number;
    uses: number;
    server: InviteServerDTO;
    memberCount: number;
};
