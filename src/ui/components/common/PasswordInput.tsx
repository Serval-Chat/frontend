import { useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/utils/cn';

import { Input, type InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
    wrapperClassName?: string;
}

export const PasswordInput = ({
    className,
    style,
    wrapperClassName,
    ...props
}: PasswordInputProps): React.ReactNode => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={cn('relative', wrapperClassName)}>
            <Input
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                className={className}
                // Inline because Input pads inline and inline beats any pr-* class;
                // a caller reclaims the space via style.paddingRight, not className.
                style={{ paddingRight: '2.5rem', ...style }}
                type={visible ? 'text' : 'password'}
            />
            <button
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title={visible ? 'Hide password' : 'Show password'}
                type="button"
                onClick={(): void => {
                    setVisible((current) => !current);
                }}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};
