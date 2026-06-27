/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationSoundDTO } from './NotificationSoundDTO';

export type UserSettingsResponseDTO = {
    muteNotifications?: boolean;
    useDiscordStyleMessages?: boolean;
    ownMessagesAlign?: UserSettingsResponseDTO.ownMessagesAlign;
    otherMessagesAlign?: UserSettingsResponseDTO.otherMessagesAlign;
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
    disableCustomUsernameFonts?: boolean;
    disableCustomUsernameColors?: boolean;
    disableCustomUsernameGlow?: boolean;
    limitedAnimations?: boolean;
    showUsersPronouns?: boolean;
    customFontUrl?: string;
    customFontFamily?: string;
    notificationSounds?: Array<NotificationSoundDTO>;
    useDefaultSounds?: boolean;
    use24HourTime?: boolean;
    keybinds?: Record<string, any>;
    serverSettings?: Record<string, any>;
};
export namespace UserSettingsResponseDTO {
    export enum ownMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
    export enum otherMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
}
