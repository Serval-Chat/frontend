import { type ReactNode } from 'react';

import {
    Badge,
    BarChart3,
    FileText,
    Server,
    Settings,
    ShieldAlert,
    Ticket,
    Users,
} from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { cn } from '@/utils/cn';

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({
    icon,
    label,
    active,
    onClick,
}: SidebarItemProps): ReactNode => (
    <Button
        className={cn(
            'flex w-full items-center justify-start gap-3 rounded-lg border-none px-3 py-2 text-sm font-medium shadow-none transition-all duration-200',
            active
                ? 'bg-primary/20 text-primary shadow-sm hover:bg-primary/30'
                : 'text-muted-foreground hover:bg-bg-secondary hover:text-foreground',
        )}
        innerClassName="gap-3"
        variant="ghost"
        onClick={onClick}
    >
        <span
            className={cn(
                'transition-transform duration-200',
                active && 'scale-110',
            )}
        >
            {icon}
        </span>
        {label}
    </Button>
);

interface AdminSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export const AdminSidebar = ({
    activeSection,
    onSectionChange,
}: AdminSidebarProps): ReactNode => (
    <aside className="fixed top-0 left-0 flex h-full w-64 flex-col border-r border-border-subtle bg-background/50 backdrop-blur-xl">
        <div className="flex h-16 items-center border-b border-border-subtle px-6">
            <Heading level={2} variant="admin-section">
                SER<span className="text-primary">ADMIN</span>
            </Heading>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
            <SidebarItem
                active={activeSection === 'overview'}
                icon={<BarChart3 size={18} />}
                label="Overview"
                onClick={() => onSectionChange('overview')}
            />
            <SidebarItem
                active={activeSection === 'users'}
                icon={<Users size={18} />}
                label="Users"
                onClick={() => onSectionChange('users')}
            />
            <SidebarItem
                active={activeSection === 'servers'}
                icon={<Server size={18} />}
                label="Servers"
                onClick={() => onSectionChange('servers')}
            />
            <SidebarItem
                active={activeSection === 'bans'}
                icon={<ShieldAlert size={18} />}
                label="Bans & Mutes"
                onClick={() => onSectionChange('bans')}
            />
            <SidebarItem
                active={activeSection === 'logs'}
                icon={<FileText size={18} />}
                label="Audit Logs"
                onClick={() => onSectionChange('logs')}
            />
            <SidebarItem
                active={activeSection === 'badges'}
                icon={<Badge size={18} />}
                label="Badges"
                onClick={() => onSectionChange('badges')}
            />
            <SidebarItem
                active={activeSection === 'invites'}
                icon={<Ticket size={18} />}
                label="Invites"
                onClick={() => onSectionChange('invites')}
            />
        </nav>

        <div className="border-t border-border-subtle p-4">
            <SidebarItem
                active={activeSection === 'settings'}
                icon={<Settings size={18} />}
                label="Settings"
                onClick={() => onSectionChange('settings')}
            />
        </div>
    </aside>
);
