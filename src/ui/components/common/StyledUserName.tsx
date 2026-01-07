import React from 'react';
import type { User } from '@/api/users/users.types';
import { NormalText } from './NormalText';
import { cn } from '@/utils/cn';

interface StyledUserNameProps {
    user?: User;
    children: React.ReactNode;
    className?: string;
}

export const StyledUserName: React.FC<StyledUserNameProps> = ({
    user,
    children,
    className,
}) => {
    if (!user) {
        return (
            <NormalText
                className={cn('font-medium truncate text-sm', className)}
            >
                {children}
            </NormalText>
        );
    }

    const { usernameGradient, usernameGlow, usernameFont } = user;

    const hasGradient =
        usernameGradient?.enabled && usernameGradient.colors.length > 0;
    const hasGlow = usernameGlow?.enabled;

    const containerStyle: React.CSSProperties = {
        fontFamily: usernameFont || undefined,
    };

    const glowStyle: React.CSSProperties = hasGlow
        ? {
              textShadow: `0 0 1px ${usernameGlow.color}, 0 0 2px ${usernameGlow.color}, 0 0 3px ${usernameGlow.color}`,
              color: 'transparent',
          }
        : { visibility: 'hidden' };

    const gradientStyle: React.CSSProperties = hasGradient
        ? {
              backgroundImage: `linear-gradient(${usernameGradient.angle}deg, ${
                  usernameGradient.colors.length === 1
                      ? `${usernameGradient.colors[0]}, ${usernameGradient.colors[0]}`
                      : usernameGradient.colors.join(', ')
              })`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
          }
        : {};

    return (
        <NormalText
            className={cn(
                'font-medium truncate text-sm w-fit grid items-center',
                className
            )}
            style={containerStyle}
        >
            <span
                className="col-start-1 row-start-1 select-none pointer-events-none"
                style={glowStyle}
                aria-hidden="true"
            >
                {children}
            </span>
            <span
                className="col-start-1 row-start-1 relative"
                style={gradientStyle}
            >
                {children}
            </span>
        </NormalText>
    );
};
