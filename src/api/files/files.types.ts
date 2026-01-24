export interface FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
    isBinary?: boolean;
    createdAt?: string;
    modifiedAt?: string;
}

export interface ProxyMetadata {
    status: number;
    headers: Record<string, string>;
    size?: number;
}
export interface FileUploadResponse {
    url: string;
}
