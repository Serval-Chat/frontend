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
}
