/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FavoriteGifResponseDTO = {
    /**
     * Klipy GIF identifier
     */
    klipyId: string;
    /**
     * Klipy GIF slug
     */
    slug?: string;
    /**
     * Full-resolution GIF URL
     */
    url: string;
    /**
     * Small / preview GIF URL
     */
    previewUrl: string;
    /**
     * GIF width in pixels
     */
    width: number;
    /**
     * GIF height in pixels
     */
    height: number;
    /**
     * Content type (gif or sticker)
     */
    contentType: FavoriteGifResponseDTO.contentType;
};
export namespace FavoriteGifResponseDTO {
    /**
     * Content type (gif or sticker)
     */
    export enum contentType {
        GIF = 'gif',
        STICKER = 'sticker',
    }
}
