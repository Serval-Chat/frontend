import type { Role } from '@/api/servers/servers.types';
import { RoleDot } from '@/ui/components/common/RoleDot';

export const RoleColorDot = ({ role }: { role?: Role }) => (
    <RoleDot className="h-3 w-3" role={role} size={12} />
);
