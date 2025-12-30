import React from 'react';
import { buttonColors, mutedColors } from '../theme/color';

type ButtonType = 'normal' | 'caution' | 'danger' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    buttonType: ButtonType;
    className?: string; // for tailwind
    loading?: boolean; // will make button muted if true
}

const buttonTypeToColorKey: Record<ButtonType, keyof typeof mutedColors> = {
    normal: 'blue',
    danger: 'red',
    caution: 'yellow',
    success: 'green',
};

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    disabled,
    ...props
}) => {
    const buttonType = props.buttonType || 'normal';
    const baseStyle = `px-2 py-1 rounded transition-colors duration-300`;

    const colorKey = buttonTypeToColorKey[buttonType];

    const finalColor = props.loading
        ? `${mutedColors[colorKey].bg} ${mutedColors[colorKey].text} ${mutedColors[colorKey].hover}`
        : `${buttonColors[buttonType]} text-white`;

    return (
        <button
            className={`${baseStyle} ${finalColor} ${className}`}
            disabled={props.loading || disabled}
            {...props}
        >
            {children}
        </button>
    );
};
