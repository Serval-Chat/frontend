export const SHOWOFF_SECTIONS = {
    flash: 'flash-buttons',
    processing: 'processing-buttons',
    animations: 'animations',
    status: 'status-messages',
    retain: 'retain-size-buttons',
    inputs: 'input-elements',
    typography: 'typography',
    userIdentities: 'user-identities',
    navigation: 'navigation',
    chatMessages: 'chat-messages',
    loadingSpinner: 'loading-spinner',
    colorPalette: 'color-palette',
    contextMenu: 'context-menu',
    userProfilePopup: 'user-profile-popup',
} as const;

export const BUTTON_VARIANTS = [
    { id: 'normal', type: 'normal', label: 'Normal' },
    { id: 'primary', type: 'primary', label: 'Primary (Gold)' },
    { id: 'caution', type: 'caution', label: 'Caution' },
    { id: 'danger', type: 'danger', label: 'Danger' },
    { id: 'success', type: 'success', label: 'Success' },
] as const;
