import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $isParagraphNode,
    $isTextNode,
    type LexicalEditor,
    type ParagraphNode,
} from 'lexical';

// insert a text token into the search editor from outside the Lexical context
export function insertSearchToken(editor: LexicalEditor, token: string): void {
    editor.update(() => {
        const root = $getRoot();
        let para: ParagraphNode;
        const first = root.getFirstChild();
        if ($isParagraphNode(first)) {
            para = first;
        } else {
            para = $createParagraphNode();
            root.append(para);
        }
        const children = para.getChildren();
        const last = children.at(-1) ?? null;
        if (last !== null && $isTextNode(last)) {
            const t = last.getTextContent();
            const next = (t.trimEnd() ? `${t.trimEnd()} ` : '') + token;
            last.setTextContent(next);
            last.select(next.length, next.length);
        } else {
            const textNode = $createTextNode(token);
            para.append(textNode);
            textNode.select(token.length, token.length);
        }
    });
    editor.focus();
}
