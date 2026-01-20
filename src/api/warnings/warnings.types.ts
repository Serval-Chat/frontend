export interface WarningIssuedBy {
    username: string;
}

export interface Warning {
    _id: string;
    userId: string;
    message: string;
    issuedBy: WarningIssuedBy;
    acknowledged: boolean;
    acknowledgedAt?: string;
    timestamp: string;
}
