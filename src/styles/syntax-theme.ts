import type React from 'react';

export const customSyntaxTheme: { [key: string]: React.CSSProperties } = {
    'code[class*="language-"]': {
        color: 'var(--syntax-variable)',
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
        color: 'var(--syntax-variable)',
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
        color: 'var(--syntax-comment)',
        fontStyle: 'italic',
    },
    prolog: {
        color: 'var(--syntax-comment)',
    },
    doctype: {
        color: 'var(--syntax-comment)',
    },
    cdata: {
        color: 'var(--syntax-comment)',
    },
    punctuation: {
        color: 'var(--syntax-operator)',
        opacity: 0.8,
    },
    namespace: {
        opacity: 0.7,
    },
    property: {
        color: 'var(--syntax-type)',
    },
    tag: {
        color: 'var(--syntax-keyword)',
    },
    'class-name': {
        color: 'var(--syntax-type)',
    },
    boolean: {
        color: 'var(--syntax-number)',
    },
    number: {
        color: 'var(--syntax-number)',
    },
    constant: {
        color: 'var(--syntax-variable)',
    },
    symbol: {
        color: 'var(--syntax-keyword)',
    },
    deleted: {
        color: 'var(--color-danger)',
    },
    selector: {
        color: 'var(--syntax-string)',
    },
    'attr-name': {
        color: 'var(--syntax-type)',
    },
    string: {
        color: 'var(--syntax-string)',
    },
    char: {
        color: 'var(--syntax-string)',
    },
    builtin: {
        color: 'var(--syntax-type)',
    },
    inserted: {
        color: 'var(--color-success)',
    },
    operator: {
        color: 'var(--syntax-operator)',
    },
    entity: {
        color: 'var(--syntax-type)',
        cursor: 'help',
    },
    url: {
        color: 'var(--syntax-keyword)',
    },
    variable: {
        color: 'var(--syntax-variable)',
    },
    atrule: {
        color: 'var(--syntax-keyword)',
    },
    'attr-value': {
        color: 'var(--syntax-string)',
    },
    function: {
        color: 'var(--syntax-function)',
    },
    keyword: {
        color: 'var(--syntax-keyword)',
        fontWeight: 'bold',
    },
    regex: {
        color: 'var(--syntax-string)',
    },
    important: {
        color: 'var(--syntax-keyword)',
        fontWeight: 'bold',
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
};
