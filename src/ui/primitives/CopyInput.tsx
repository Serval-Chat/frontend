import React, { useEffect, useRef, useState } from 'react';

import { Check, Copy, X } from 'lucide-react';

import { cn } from '@/utils/cn';

import { Input, type InputProps } from './Input';

const COPY_CONFIRM_MS = 2000;

type CopyStatus = 'idle' | 'copied' | 'failed';

interface CopyAffordanceProps {
    label: string;
    resolveText: () => string;
    className?: string;
}

const copyViaLegacyApi = (text: string): boolean => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.append(area);
    try {
        area.select();
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        area.remove();
    }
};

const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator.clipboard?.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // permission denied or otherwise blocked
        }
    }
    return copyViaLegacyApi(text);
};

const CopyAffordance = ({
    label,
    resolveText,
    className,
}: CopyAffordanceProps): React.ReactNode => {
    const [status, setStatus] = useState<CopyStatus>('idle');

    useEffect((): (() => void) | undefined => {
        if (status === 'idle') return undefined;
        const timer = setTimeout(
            (): void => setStatus('idle'),
            COPY_CONFIRM_MS,
        );
        return (): void => clearTimeout(timer);
    }, [status]);

    const handleCopy = (): void => {
        void copyTextToClipboard(resolveText()).then(
            (copied): void => setStatus(copied ? 'copied' : 'failed'),
            (): void => setStatus('failed'),
        );
    };

    const statusLabel =
        status === 'copied'
            ? 'Copied!'
            : status === 'failed'
              ? 'Copy failed'
              : label;

    return (
        <>
            <button
                aria-label={statusLabel}
                className={cn(
                    'absolute flex items-center text-muted-foreground transition-colors hover:text-foreground',
                    className,
                )}
                title={statusLabel}
                type="button"
                onClick={handleCopy}
            >
                {status === 'copied' ? (
                    <Check className="text-success" size={18} />
                ) : status === 'failed' ? (
                    <X className="text-danger" size={18} />
                ) : (
                    <Copy size={18} />
                )}
            </button>
            <span aria-live="polite" className="sr-only">
                {status === 'idle' ? '' : statusLabel}
            </span>
        </>
    );
};

export interface CopyInputProps extends InputProps {
    /**
     * Text written to the clipboard when it differs from what the field shows.
     * `null` renders no copy button at all, for fields with nothing worth copying.
     */
    copyValue?: string | null;
    /** Accessible name of the in-field copy button. */
    copyLabel?: string;
    wrapperClassName?: string;
}

export const CopyInput = ({
    copyValue,
    copyLabel = 'Copy',
    wrapperClassName,
    className,
    style,
    value,
    ref,
    ...props
}: CopyInputProps): React.ReactNode => {
    const inputRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, (): HTMLInputElement => inputRef.current!);

    const resolveText = (): string => {
        if (copyValue !== undefined && copyValue !== null) return copyValue;
        if (value !== undefined) return String(value);
        return inputRef.current?.value ?? '';
    };

    return (
        <div className={cn('relative w-full', wrapperClassName)}>
            <Input
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                className={className}
                ref={inputRef}
                style={{ paddingRight: '2.5rem', ...style }}
                value={value}
            />
            {copyValue === null ? null : (
                <CopyAffordance
                    className="top-1/2 right-3 -translate-y-1/2"
                    label={copyLabel}
                    resolveText={resolveText}
                />
            )}
        </div>
    );
};

export interface CopyTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** @see CopyInputProps.copyValue */
    copyValue?: string | null;
    /** @see CopyInputProps.copyLabel */
    copyLabel?: string;
    wrapperClassName?: string;
    ref?: React.Ref<HTMLTextAreaElement>;
}

export const CopyTextArea = ({
    copyValue,
    copyLabel = 'Copy',
    wrapperClassName,
    className,
    style,
    value,
    ref,
    ...props
}: CopyTextAreaProps): React.ReactNode => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(
        ref,
        (): HTMLTextAreaElement => textAreaRef.current!,
    );

    const resolveText = (): string => {
        if (copyValue !== undefined && copyValue !== null) return copyValue;
        if (value !== undefined) return String(value);
        return textAreaRef.current?.value ?? '';
    };

    return (
        <div className={cn('relative w-full', wrapperClassName)}>
            <textarea
                {...props}
                className={className}
                ref={textAreaRef}
                style={{ paddingRight: '2.5rem', ...style }}
                value={value}
            />
            {copyValue === null ? null : (
                <CopyAffordance
                    className="top-2 right-3"
                    label={copyLabel}
                    resolveText={resolveText}
                />
            )}
        </div>
    );
};
