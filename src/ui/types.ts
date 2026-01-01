export type StatusType = 'error' | 'success' | '';

export interface StatusState {
    message: string;
    type: StatusType;
}
