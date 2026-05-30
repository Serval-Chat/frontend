/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { InteractionOptionDTO } from './InteractionOptionDTO';

export type CreateInteractionRequestDTO = {
    command: string;
    commandId?: string;
    options?: Array<InteractionOptionDTO>;
    serverId: string;
    channelId: string;
};
