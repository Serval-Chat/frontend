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
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-b-0">
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
        <div className="flex shrink-0 overflow-hidden rounded-md border border-border-subtle bg-bg-secondary p-1">
            <Button
                className={cn(
                    'h-8 w-10 rounded-l border-none p-0 text-muted-foreground shadow-none transition-all',
                    value === false
                        ? 'bg-danger text-white hover:bg-danger-hover'
                        : 'hover:bg-danger hover:text-white',
                )}
                title="Deny"
                variant="ghost"
                onClick={() => onChange(value === false ? undefined : false)}
            >
                <X size={16} />
            </Button>
            <Button
                className={cn(
                    'h-8 w-10 rounded-none border-x border-border-subtle p-0 text-muted-foreground shadow-none transition-all',
                    value === undefined
                        ? 'bg-bg-subtle text-foreground'
                        : 'hover:bg-bg-subtle hover:text-foreground',
                )}
                title="Inherit"
                variant="ghost"
                onClick={() => onChange(undefined)}
            >
                <Minus size={16} />
            </Button>
            <Button
                className={cn(
                    'h-8 w-10 rounded-r border-none p-0 text-muted-foreground shadow-none transition-all',
                    value === true
                        ? 'bg-success text-white hover:bg-success-hover'
                        : 'hover:bg-success hover:text-white',
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
