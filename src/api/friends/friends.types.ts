export interface Friend {
    _id: string;
    username: string;
    displayName?: string;
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
