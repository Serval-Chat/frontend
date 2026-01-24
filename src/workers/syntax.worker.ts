import { refractor } from 'refractor/all';

refractor.alias({
    cpp: ['hpp', 'h++', 'hh', 'hxx', 'ino', 'cc'],
    bash: ['sh', 'zsh', 'bashrc', 'profile', 'shrc'],
    python: ['py', 'pyw', 'pyi'],
    javascript: ['js', 'mjs', 'cjs'],
    typescript: ['ts', 'mts', 'cts', 'tsx'],
    yaml: ['yml'],
    markdown: ['md', 'mkd'],
    sql: ['sql', 'ddl', 'dml'],
});

interface AstNode {
    type: string;
    value?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: AstNode[];
}

function lineify(nodes: AstNode[]): AstNode[][] {
    const lines: AstNode[][] = [[]];

    function pushToLines(node: AstNode): void {
        lines[lines.length - 1].push(node);
    }

    function process(nodes: AstNode[], parentWrapper?: AstNode): void {
        for (const node of nodes) {
            if (node.type === 'text' && node.value) {
                const textParts = node.value.split('\n');

                for (let i = 0; i < textParts.length; i++) {
                    if (i > 0) lines.push([]);

                    if (textParts[i]) {
                        const textNode: AstNode = {
                            type: 'text',
                            value: textParts[i],
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

self.onmessage = (e: MessageEvent) => {
    const { content, language } = e.data;

    try {
        const _registered = refractor.registered(language);
        const result = refractor.highlight(
            content,
            _registered ? language : 'text',
        );

        const lines = lineify(result.children);
        self.postMessage(lines);
    } catch (err) {
        console.error('Worker highlight error:', err);
        const lines = content
            .split('\n')
            .map((line: string) => [{ type: 'text', value: line }]);
        self.postMessage(lines);
    }
};
