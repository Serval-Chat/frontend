/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsernameGlowDTO } from './UsernameGlowDTO';
import type { UsernameGradientDTO } from './UsernameGradientDTO';

export type UpdateStyleRequestDTO = {
    usernameFont?: UpdateStyleRequestDTO.usernameFont;
    usernameGradient?: UsernameGradientDTO;
    usernameGlow?: UsernameGlowDTO;
};
export namespace UpdateStyleRequestDTO {
    export enum usernameFont {
        DEFAULT = 'default',
        AUDIOWIDE = 'Audiowide',
        BEBAS_NEUE = 'Bebas Neue',
        BETANIA_PATMOS = 'Betania Patmos',
        GOOGLE_SANS_CODE = 'Google Sans Code',
        NOTO_SANS = 'Noto Sans',
        PACIFICO = 'Pacifico',
        PLAYPEN_SANS_DEVA = 'Playpen Sans Deva',
        RAMPART_ONE = 'Rampart One',
        ROBOTO = 'Roboto',
        WORKBENCH = 'Workbench',
    }
}
