import { Check, Minus, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { colors } from '@/ui/theme';

interface PermissionOverrideSwitchProps {
    label: string;
    description: string;
    value: boolean | undefined;
    onChange: (value: boolean | undefined) => void;
    danger?: boolean;
}

export const PermissionOverrideSwitch = ({
    label,
    description,
    value,
    onChange,
    danger,
}: PermissionOverrideSwitchProps) => (
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
                className="h-8 w-10 rounded-l border-none p-0 shadow-none transition-all"
                title="Deny"
                variant={value === false ? 'danger' : 'ghost'}
                onClick={(): void => {
                    onChange(value === false ? undefined : false);
                }}
            >
                <X size={16} />
            </Button>
            <Button
                className="h-8 w-10 rounded-none border-x border-border-subtle p-0 shadow-none transition-all"
                style={
                    value === undefined
                        ? {
                              backgroundColor: colors.bgSubtle,
                              color: colors.foreground,
                          }
                        : undefined
                }
                title="Inherit"
                variant="ghost"
                onClick={(): void => {
                    onChange(undefined);
                }}
            >
                <Minus size={16} />
            </Button>
            <Button
                className="h-8 w-10 rounded-r border-none p-0 shadow-none transition-all"
                title="Allow"
                variant={value === true ? 'success' : 'ghost'}
                onClick={(): void => {
                    onChange(value === true ? undefined : true);
                }}
            >
                <Check size={16} />
            </Button>
        </div>
    </div>
);
