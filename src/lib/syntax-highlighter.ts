import { refractor } from 'refractor/all';

import type { AstNode } from '@/ui/components/common/CodeModal';

refractor.alias({
    cpp: ['c++', 'hpp', 'h++', 'hh', 'hxx', 'ino', 'cc'],
    bash: ['sh', 'zsh', 'bashrc', 'profile', 'shrc'],
    python: ['py', 'pyw', 'pyi'],
    javascript: ['js', 'mjs', 'cjs'],
    typescript: ['ts', 'mts', 'cts', 'tsx'],
    yaml: ['yml'],
    markdown: ['md', 'mkd'],
    sql: ['sql', 'ddl', 'dml'],
});

const CACHE_LIMIT = 500;
const highlightCache = new Map<string, AstNode[][]>();

function lineify(nodes: AstNode[]): AstNode[][] {
    const lines: AstNode[][] = [[]];

    function pushToLines(node: AstNode): void {
        lines.at(-1)!.push(node);
    }

    function process(nodes: AstNode[], parentWrapper?: AstNode): void {
        for (const node of nodes) {
            if (node.type === 'text' && node.value) {
                const textParts = node.value.split('\n');

                for (const [i, textPart] of textParts.entries()) {
                    if (i > 0) lines.push([]);

                    if (textPart) {
                        const textNode: AstNode = {
                            type: 'text',
                            value: textPart,
                        };
                        if (parentWrapper) {
                            pushToLines({
                                ...parentWrapper,
                                children: [textNode],
                            });
                        } else {
                            pushToLines(textNode);
                        }
                    }
                }
            } else if (node.type === 'element' && node.children) {
                process(node.children, node);
            }
        }
    }

    process(nodes);
    return lines;
}

export function getCachedHighlight(content: string, language: string): AstNode[][] | undefined {
    const langKey = language.toLowerCase();
    const cacheKey = `${langKey}:${content}`;
    return highlightCache.get(cacheKey);
}

export function addToCache(content: string, language: string, lines: AstNode[][]): void {
    const langKey = language.toLowerCase();
    const cacheKey = `${langKey}:${content}`;
    if (highlightCache.size >= CACHE_LIMIT) {
        const firstKey = highlightCache.keys().next().value;
        if (firstKey !== undefined) {
            highlightCache.delete(firstKey);
        }
    }
    highlightCache.set(cacheKey, lines);
}

export function highlightCode(content: string, language: string): AstNode[][] {
    const langKey = language.toLowerCase();
    const cacheKey = `${langKey}:${content}`;

    if (highlightCache.has(cacheKey)) {
        const cached = highlightCache.get(cacheKey)!;
        highlightCache.delete(cacheKey);
        highlightCache.set(cacheKey, cached);
        return cached;
    }

    try {
        const isRegistered = refractor.registered(langKey);
        const result = refractor.highlight(
            content,
            isRegistered ? langKey : 'text',
        );
        const lines = lineify(result.children as AstNode[]);

        if (highlightCache.size >= CACHE_LIMIT) {
            const firstKey = highlightCache.keys().next().value;
            if (firstKey !== undefined) {
                highlightCache.delete(firstKey);
            }
        }
        highlightCache.set(cacheKey, lines);

        return lines;
    } catch (error) {
        console.error('Highlight error:', error);
        return content.split('\n').map((line) => [{ type: 'text', value: line }]);
    }
}
