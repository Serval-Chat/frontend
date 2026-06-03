/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DmMessageResponseDTO = {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: string;
    editedAt?: string;
    isEdited: boolean;
    replyToId?: string;
    reactions: Array<Record<string, any>>;
    attachments: Array<Record<string, any>>;
    deletedAt?: Record<string, any> | null;
    poll: Record<string, any> | null;
};
