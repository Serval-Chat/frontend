import { type ReactNode } from 'react';

import {
    BadgeCheck,
    BarChart3,
    FileText,
    Server,
    Settings,
    ShieldAlert,
    Ticket,
    Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Heading } from '@/ui/components/common/Heading';
import { cn } from '@/utils/cn';

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    to: string;
}

const SidebarItem = ({ icon, label, to }: SidebarItemProps): ReactNode => {
    const location = useLocation();
    const active =
        location.pathname.startsWith(to) &&
        (to !== '/admin' ||
            location.pathname === '/admin' ||
            location.pathname === '/admin/');

    return (
        <Link
            className={cn(
                'flex w-full items-center justify-start gap-3 rounded-lg border-none px-3 py-2 text-sm font-medium shadow-none transition-all duration-200 hover:no-underline',
                active
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-bg-secondary hover:text-foreground',
            )}
            to={to}
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
        </Link>
    );
};

export const AdminSidebar = (): ReactNode => {
    const location = useLocation();
    const isServersOpen = location.pathname.startsWith('/admin/servers');

    return (
        <aside className="fixed top-0 left-0 flex h-full w-64 flex-col border-r border-border-subtle bg-background/50 backdrop-blur-xl">
            <div className="flex h-16 items-center border-b border-border-subtle px-6">
                <Heading level={2} variant="admin-section">
                    SER<span className="text-primary">ADMIN</span>
                </Heading>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                <SidebarItem
                    icon={<BarChart3 size={18} />}
                    label="Overview"
                    to="/admin/overview"
                />
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Users"
                    to="/admin/users"
                />

                <div className="space-y-1">
                    <SidebarItem
                        icon={<Server size={18} />}
                        label="Servers"
                        to="/admin/servers"
                    />
                    {isServersOpen && (
                        <div className="animate-in slide-in-from-top-1 fade-in ml-9 duration-200">
                            <Link
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-lg border-none px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:no-underline',
                                    location.pathname ===
                                        '/admin/servers/review'
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                                to="/admin/servers/review"
                            >
                                <BadgeCheck
                                    className={
                                        location.pathname ===
                                        '/admin/servers/review'
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                    }
                                    size={14}
                                />
                                Awaiting Review
                            </Link>
                        </div>
                    )}
                </div>

                <SidebarItem
                    icon={<ShieldAlert size={18} />}
                    label="Bans & Mutes"
                    to="/admin/bans"
                />
                <SidebarItem
                    icon={<FileText size={18} />}
                    label="Audit Logs"
                    to="/admin/logs"
                />
                <SidebarItem
                    icon={<BadgeCheck size={18} />}
                    label="Badges"
                    to="/admin/badges"
                />
                <SidebarItem
                    icon={<Ticket size={18} />}
                    label="Invites"
                    to="/admin/invites"
                />
            </nav>

            <div className="border-t border-border-subtle p-4">
                <SidebarItem
                    icon={<Settings size={18} />}
                    label="Settings"
                    to="/admin/settings"
                />
            </div>
        </aside>
    );
};
