export interface DmChannel {
    id: string;
    type: 'dm' | 'group_dm';
    recipientIds: string[];
    createdAt: string;
    lastMessageAt: string | null;
}
