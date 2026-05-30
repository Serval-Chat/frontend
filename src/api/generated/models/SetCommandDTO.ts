/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { SlashCommandOptionDTO } from './SlashCommandOptionDTO';

export type SetCommandDTO = {
    name: string;
    description: string;
    options?: Array<SlashCommandOptionDTO>;
    shouldReply?: boolean;
};
