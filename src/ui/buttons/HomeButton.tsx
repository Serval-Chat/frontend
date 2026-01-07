import React from 'react';

import { Home } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

interface HomeButtonProps {
    onClick?: () => void;
    isActive?: boolean;
    className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({
    onClick,
    isActive,
    className,
}) => {
    return (
        <Button
            variant="nav"
            onClick={onClick}
            className={cn(className, isActive && 'bg-white/10 text-white')}
        >
            <Home size={24} />
        </Button>
    );
};
