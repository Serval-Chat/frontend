import React, { useEffect, useRef } from 'react';

import katex from 'katex';

interface LatexRendererProps {
    content: string;
    displayMode?: boolean;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({
    content,
    displayMode = false,
}) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        // keep displayMode=false to avoid KaTeX's centering+full-width.
        const source = displayMode ? `\\displaystyle ${content}` : content;
        try {
            katex.render(source, ref.current, {
                displayMode: false,
                throwOnError: false,
                output: 'html',
            });
        } catch {
            ref.current.textContent = content;
        }
    }, [content, displayMode]);

    if (displayMode) {
        return <span className="block my-1 overflow-x-auto" ref={ref} />;
    }

    return <span ref={ref} />;
};
