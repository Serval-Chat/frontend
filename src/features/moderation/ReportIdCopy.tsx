import { useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { useToast } from '@/ui/primitives/Toast';

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
            <Text size="xs" variant="muted">
                Report ID
            </Text>
            <code className="font-mono text-xs break-all">{id}</code>
            <Pressable
                aria-label={`Copy report ID ${id}`}
                className="rounded p-1 text-muted-foreground hover:bg-bg-secondary hover:text-foreground"
                title={copied ? 'Copied' : 'Copy report ID'}
                onClick={(): void => {
                    void copyId();
                }}
            >
                {copied ? <Check size={15} /> : <Copy size={15} />}
            </Pressable>
        </div>
    );
};
