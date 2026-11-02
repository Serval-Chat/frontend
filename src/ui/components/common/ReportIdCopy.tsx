import { useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { useToast } from './Toast';

export const ReportIdCopy = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToast();

    const copyId = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(id);
            setCopied(true);
            showToast('Report ID copied to clipboard.', 'success');
        } catch {
            setCopied(false);
            showToast('Could not copy the report ID.', 'error');
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2">
            <span className="text-xs text-muted-foreground">Report ID</span>
            <code className="font-mono text-xs break-all">{id}</code>
            <button
                aria-label={`Copy report ID ${id}`}
                className="hover:bg-bg-tertiary rounded p-1 text-muted-foreground hover:text-foreground"
                title={copied ? 'Copied' : 'Copy report ID'}
                type="button"
                onClick={(): void => {
                    void copyId();
                }}
            >
                {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
        </div>
    );
};
