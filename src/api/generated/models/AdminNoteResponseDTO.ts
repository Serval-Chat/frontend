/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { AdminNoteAdminInfoDTO } from './AdminNoteAdminInfoDTO';
import type { AdminNoteHistoryDTO } from './AdminNoteHistoryDTO';

export type AdminNoteResponseDTO = {
    id: string;
    targetId: string;
    targetType: string;
    adminId: AdminNoteAdminInfoDTO;
    content: string;
    history: Array<AdminNoteHistoryDTO>;
    deletedAt?: string;
    deletedBy?: AdminNoteAdminInfoDTO;
    deleteReason?: string;
    createdAt: string;
    updatedAt: string;
};
