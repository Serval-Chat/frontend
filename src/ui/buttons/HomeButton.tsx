import React from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/ui/components/Button';

interface HomeButtonProps {
    onClick?: () => void;
    className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({
    onClick,
    className,
}) => {
    return (
        <Button variant="nav" onClick={onClick} className={className}>
            <Home size={24} />
        </Button>
    );
};
