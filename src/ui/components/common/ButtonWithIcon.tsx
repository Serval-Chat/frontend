import React from 'react';

import { type LucideIcon } from 'lucide-react';

import { cn } from '@/utils/cn';

import { Button, type ButtonProps } from './Button';

export interface ButtonWithIconProps extends ButtonProps {
    icon: LucideIcon;
    iconClassName?: string;
    textClassName?: string;
}

export const ButtonWithIcon = React.forwardRef<
    HTMLButtonElement,
    ButtonWithIconProps
>(({ icon, iconClassName, textClassName, children, ...props }, ref) =>
    React.createElement(Button, {
        ...props,
        ref,
        children,
        icon,
        iconClassName: cn('sm', iconClassName),
        innerClassName: cn('ml-2', textClassName),
    }),
);

ButtonWithIcon.displayName = 'ButtonWithIcon';
