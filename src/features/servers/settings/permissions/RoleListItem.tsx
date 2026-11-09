import type { Role } from '@/api/servers/servers.types';
import { Button } from '@/ui/primitives/Button';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';

import { RoleColorDot } from './RoleColorDot';

interface RoleListItemProps {
    role: Role;
    isActive: boolean;
    onClick: () => void;
}

export const RoleListItem = ({
    role,
    isActive,
    onClick,
}: RoleListItemProps) => (
    <Button
        aria-current={isActive ? 'true' : undefined}
        className={cn(
            'w-full justify-start border-none px-3 py-2 text-sm shadow-none transition-all duration-200',
            isActive
                ? 'bg-bg-subtle font-semibold text-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-bg-subtle hover:text-foreground focus:outline-none',
        )}
        variant="ghost"
        onClick={onClick}
    >
        <div className="flex items-center gap-2 truncate">
            <RoleColorDot role={role} />
            <Text className="truncate">{role.name}</Text>
        </div>
    </Button>
);
