export interface WarningIssuedBy {
    username: string;
}

export interface Warning {
    id: string;
    userId: string;
    message: string;
    issuedBy: WarningIssuedBy;
    acknowledged: boolean;
    acknowledgedAt?: string;
    timestamp: string;
    // Minutes after acknowledgment before this warning's record expires.
    expiryDurationMinutes?: number;
    // Only set once the warning has been acknowledged.
    expiresAt?: string;
}
