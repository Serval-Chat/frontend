import React from 'react';

import type { UserKeybinds } from '@/api/users/users.types';

import { KeybindManager } from './KeybindManager';

export const useKeybindManager = (
    keybinds: UserKeybinds | undefined,
): KeybindManager =>
    React.useMemo(
        (): KeybindManager => new KeybindManager(keybinds),
        [keybinds],
    );
