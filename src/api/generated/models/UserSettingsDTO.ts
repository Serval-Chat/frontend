/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserSettingsDTO = {
    muteNotifications?: boolean;
    useDiscordStyleMessages?: boolean;
    ownMessagesAlign?: UserSettingsDTO.ownMessagesAlign;
    otherMessagesAlign?: UserSettingsDTO.otherMessagesAlign;
    showYouLabel?: boolean;
    ownMessageColor?: string;
    otherMessageColor?: string;
    disableCustomUsernameFonts?: boolean;
    disableCustomUsernameColors?: boolean;
    disableCustomUsernameGlow?: boolean;
    limitedAnimations?: boolean;
    keybinds?: Record<string, any>;
};
export namespace UserSettingsDTO {
    export enum ownMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
    export enum otherMessagesAlign {
        LEFT = 'left',
        RIGHT = 'right',
    }
}
