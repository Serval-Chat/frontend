export interface Friend {
    id: string;
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
    id: string;
    from?: string;
    fromId?: string;
    to?: string;
    toId?: string;
    status?: string;
    createdAt: string;
}

export interface SendFriendRequestResponse {
    request: FriendRequest;
}

export interface AcceptFriendRequestResponse {
    friend: Friend | null;
}
