/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ServerInviteResponseDTO = {
    _id: string;
    code: string;
    serverId: string;
    createdByUserId: string;
    createdAt: string;
    expiresAt?: string;
    maxUses?: number;
    uses: number;
};
