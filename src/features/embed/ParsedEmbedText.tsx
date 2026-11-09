import { type ReactNode, memo, useMemo } from 'react';

import { ParsedText } from '@/features/messages/ParsedText';
import { type ParserOptions, parseText } from '@/utils/textParser/parser';

interface ParsedEmbedTextProps {
    text: string;
    preset: ParserOptions;
    serverId?: string;
    size?: 'xs' | 'sm' | 'base';
    variant?: 'danger' | 'muted';
    wrap?: 'preWrap';
    onResize?: () => void;
}

export const ParsedEmbedText = memo(
    ({
        text,
        preset,
        serverId,
        size,
        variant,
        wrap,
        onResize,
    }: ParsedEmbedTextProps): ReactNode => {
        const nodes = useMemo(() => parseText(text, preset), [text, preset]);

        return (
            <ParsedText
                nodes={nodes}
                serverId={serverId}
                size={size}
                variant={variant}
                wrap={wrap}
                onResize={onResize}
            />
        );
    },
);

ParsedEmbedText.displayName = 'ParsedEmbedText';
