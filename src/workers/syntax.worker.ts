import { highlightCode } from '@/lib/syntax-highlighter';

globalThis.onmessage = (e: MessageEvent): void => {
    const { content, language } = e.data;
    const lines = highlightCode(content, language);
    self.postMessage(lines);
};
