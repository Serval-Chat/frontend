import React from 'react';

import { Pencil } from 'lucide-react';

import { Pressable } from '@/ui/primitives/Pressable';
import { cn } from '@/utils/cn';

export const InlineEditableField = ({
    value,
    onChange,
    inputClassName,
    title,
    multiline,
    placeholder,
    buttonClassName,
    children,
}: {
    value: string;
    onChange: (value: string) => void;
    inputClassName: string;
    title: string;
    multiline?: boolean;
    placeholder?: string;
    buttonClassName?: string;
    children: React.ReactNode;
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect((): void => {
        if (isEditing) {
            const el = multiline ? textareaRef.current : inputRef.current;
            el?.focus();
            el?.select();
        }
    }, [isEditing, multiline]);

    if (isEditing && multiline) {
        return (
            // eslint-disable-next-line no-ui/no-raw-controls-outside-primitives -- inline bio editor sized by inputClassName to the card; TextArea's wrapper and chrome would change the card layout
            <textarea
                aria-label={title}
                className={inputClassName}
                placeholder={placeholder}
                ref={textareaRef}
                value={value}
                onBlur={(): void => {
                    setIsEditing(false);
                }}
                onChange={(e): void => {
                    onChange(e.target.value);
                }}
                onKeyDown={(e): void => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsEditing(false);
                    }
                }}
            />
        );
    }

    if (isEditing) {
        return (
            // eslint-disable-next-line no-ui/no-raw-controls-outside-primitives -- inline rename editor sized by inputClassName to the text it replaces; Input's fixed height and chrome would change the card layout
            <input
                aria-label={title}
                className={inputClassName}
                ref={inputRef}
                value={value}
                onBlur={(): void => {
                    setIsEditing(false);
                }}
                onChange={(e): void => {
                    onChange(e.target.value);
                }}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        e.preventDefault();
                        setIsEditing(false);
                    }
                }}
            />
        );
    }

    return (
        <Pressable
            className={cn(
                'group/inline-edit -mx-1 inline-flex min-w-0 items-center gap-1.5 rounded px-1 text-left hover:bg-bg-subtle',
                buttonClassName,
            )}
            title={title}
            onClick={(): void => {
                setIsEditing(true);
            }}
        >
            {children}
            <Pencil
                className={cn(
                    'shrink-0 text-muted-foreground',
                    multiline && 'mt-0.5',
                )}
                size={12}
            />
        </Pressable>
    );
};
