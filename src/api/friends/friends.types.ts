export interface Friend {
    _id: string;
    username: string;
    displayName?: string | null;
    createdAt: string;
    profilePicture: string | null;
    customStatus: {
        text?: string;
        emoji?: string;
    } | null;
    latestMessageAt?: string | null;
}

export interface FriendRequest {
    _id: string;
    from?: string;
    fromId?: string;
    createdAt: string;
}
