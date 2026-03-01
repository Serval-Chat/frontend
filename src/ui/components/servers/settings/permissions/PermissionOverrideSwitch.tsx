import React from 'react';

import { Check, Minus, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

interface PermissionOverrideSwitchProps {
    label: string;
    description: string;
    value: boolean | undefined;
    onChange: (value: boolean | undefined) => void;
    danger?: boolean;
}

export const PermissionOverrideSwitch: React.FC<
    PermissionOverrideSwitchProps
> = ({ label, description, value, onChange, danger }) => (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)] last:border-b-0">
        <div className="flex-1 pr-4">
            <Text
                as="p"
                variant={danger ? 'danger' : 'default'}
                weight="semibold"
            >
                {label}
            </Text>
            <Text as="p" leading="snug" size="xs" variant="muted">
                {description}
            </Text>
        </div>
        <div className="flex bg-[var(--color-bg-secondary)] rounded-md p-1 border border-[var(--color-border-subtle)] overflow-hidden shrink-0">
            <Button
                className={cn(
                    'w-10 h-8 p-0 rounded-l transition-all border-none shadow-none text-[var(--color-muted-foreground)]',
                    value === false
                        ? 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]'
                        : 'hover:bg-[var(--color-danger)] hover:text-white',
                )}
                title="Deny"
                variant="ghost"
                onClick={() => onChange(value === false ? undefined : false)}
            >
                <X size={16} />
            </Button>
            <Button
                className={cn(
                    'w-10 h-8 p-0 rounded-none transition-all border-x border-[var(--color-border-subtle)] shadow-none text-[var(--color-muted-foreground)]',
                    value === undefined
                        ? 'bg-[var(--color-bg-subtle)] text-[var(--color-foreground)]'
                        : 'hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-foreground)]',
                )}
                title="Inherit"
                variant="ghost"
                onClick={() => onChange(undefined)}
            >
                <Minus size={16} />
            </Button>
            <Button
                className={cn(
                    'w-10 h-8 p-0 rounded-r transition-all border-none shadow-none text-[var(--color-muted-foreground)]',
                    value === true
                        ? 'bg-[var(--color-success)] text-white hover:bg-[var(--color-success-hover)]'
                        : 'hover:bg-[var(--color-success)] hover:text-white',
                )}
                title="Allow"
                variant="ghost"
                onClick={() => onChange(value === true ? undefined : true)}
            >
                <Check size={16} />
            </Button>
        </div>
    </div>
);
