import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/ui/components/common/Button';

interface SettingsButtonProps {
    onClick?: () => void;
    className?: string;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
    onClick,
    className,
}) => {
    return (
        <Button variant="nav" onClick={onClick} className={className}>
            <Settings size={24} />
        </Button>
    );
};
