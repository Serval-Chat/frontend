/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KeybindBindingDTO } from './KeybindBindingDTO';
import type { NotificationSoundDTO } from './NotificationSoundDTO';

export type UpdateSettingsRequestDTO = {
    muteNotifications?: boolean;
    useDiscordStyleMessages?: boolean;
    ownMessagesAlign?: UpdateSettingsRequestDTO.ownMessagesAlign;
    otherMessagesAlign?: UpdateSettingsRequestDTO.otherMessagesAlign;
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
    disableCustomUsernameFonts?: boolean;
    disableCustomUsernameColors?: boolean;
    disableCustomUsernameGlow?: boolean;
    customFontUrl?: string;
    customFontFamily?: string;
    notificationSounds?: Array<NotificationSoundDTO>;
    useDefaultSounds?: boolean;
    use24HourTime?: boolean;
    keybinds?: Record<string, KeybindBindingDTO | null>;
};
export namespace UpdateSettingsRequestDTO {
    export enum ownMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
    export enum otherMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
}
