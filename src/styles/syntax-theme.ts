/**
 * @description Serval theme
 */
export const customSyntaxTheme: { [key: string]: React.CSSProperties } = {
    'code[class*="language-"]': {
        color: 'var(--color-foreground)',
        background: 'none',
        fontFamily: 'var(--font-mono)',
        textAlign: 'left',
        whiteSpace: 'pre',
        wordSpacing: 'normal',
        wordBreak: 'normal',
        wordWrap: 'normal',
        lineHeight: '1.5',
        MozTabSize: '4',
        OTabSize: '4',
        tabSize: '4',
        WebkitHyphens: 'none',
        MozHyphens: 'none',
        msHyphens: 'none',
        hyphens: 'none',
    },
    'pre[class*="language-"]': {
        color: 'var(--color-foreground)',
        background: 'none',
        fontFamily: 'var(--font-mono)',
        textAlign: 'left',
        whiteSpace: 'pre',
        wordSpacing: 'normal',
        wordBreak: 'normal',
        wordWrap: 'normal',
        lineHeight: '1.5',
        MozTabSize: '4',
        OTabSize: '4',
        tabSize: '4',
        WebkitHyphens: 'none',
        MozHyphens: 'none',
        msHyphens: 'none',
        hyphens: 'none',
        margin: '0',
        overflow: 'auto',
    },
    comment: {
        color: 'var(--color-muted-foreground)',
        fontStyle: 'italic',
    },
    prolog: {
        color: 'var(--color-muted-foreground)',
    },
    doctype: {
        color: 'var(--color-muted-foreground)',
    },
    cdata: {
        color: 'var(--color-muted-foreground)',
    },
    punctuation: {
        color: 'var(--color-foreground)',
        opacity: 0.7,
    },
    namespace: {
        opacity: 0.7,
    },
    property: {
        color: 'var(--color-caution-muted-text)',
    },
    tag: {
        color: 'var(--color-primary)',
    },
    'class-name': {
        color: 'var(--color-caution-muted-text)',
    },
    boolean: {
        color: 'var(--color-danger-muted-text)',
    },
    number: {
        color: 'var(--color-danger-muted-text)',
    },
    constant: {
        color: 'var(--color-caution-muted-text)',
    },
    symbol: {
        color: 'var(--color-primary)',
    },
    deleted: {
        color: 'var(--color-danger)',
    },
    selector: {
        color: 'var(--color-success-muted-text)',
    },
    'attr-name': {
        color: 'var(--color-caution-muted-text)',
    },
    string: {
        color: 'var(--color-success-muted-text)',
    },
    char: {
        color: 'var(--color-success-muted-text)',
    },
    builtin: {
        color: 'var(--color-caution-muted-text)',
    },
    inserted: {
        color: 'var(--color-success)',
    },
    operator: {
        color: 'var(--color-foreground)',
        opacity: 0.6,
    },
    entity: {
        color: 'var(--color-caution-muted-text)',
        cursor: 'help',
    },
    url: {
        color: 'var(--color-primary)',
    },
    '.language-css .token.string': {
        color: 'var(--color-success-muted-text)',
    },
    '.style .token.string': {
        color: 'var(--color-success-muted-text)',
    },
    variable: {
        color: 'var(--color-foreground)',
    },
    atrule: {
        color: 'var(--color-danger-muted-text)',
    },
    'attr-value': {
        color: 'var(--color-success-muted-text)',
    },
    function: {
        color: 'var(--color-caution-muted-text)',
    },
    keyword: {
        color: 'var(--color-danger-muted-text)',
        fontWeight: 'bold',
    },
    regex: {
        color: 'var(--color-caution)',
    },
    important: {
        color: 'var(--color-primary)',
        fontWeight: 'bold',
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
};
