import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { registerMarkdownFormatting } from './markdownFormatting';

export const LexicalMarkdownFormattingPlugin = (): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => registerMarkdownFormatting(editor), [editor]);

    return null;
};
