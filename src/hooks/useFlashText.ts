import { useState } from 'react';

export function useFlashText(
    initialText: string,
    flashText: string,
    duration: number
) {
    const [text, setText] = useState(initialText);

    const flash = () => {
        const oldText = text;
        setText(flashText);
        setTimeout(() => setText(oldText), duration);
    };

    return [text, flash] as const;
}
