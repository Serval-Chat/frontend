import { type ReactNode } from 'react';

import { Book, Bot, ExternalLink } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

const navItems = [{ to: '/developer/bots', label: 'My Bots', icon: Bot }];

export const DevSidebar = (): ReactNode => (
    <div className="sticky top-0 flex h-screen w-56 flex-shrink-0 flex-col border-r border-border-subtle bg-bg-secondary">
        <div className="px-3 py-4">
            <div className="mb-6 px-2">
                <Text className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Developer
                </Text>
            </div>
            <nav className="flex flex-col gap-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        className={({ isActive }): string =>
                            cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
                            )
                        }
                        key={to}
                        to={to}
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
                <div className="my-2 h-px bg-border-subtle" />
                <a
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
                    href="/docs/index.html"
                    rel="noreferrer"
                    target="_blank"
                >
                    <div className="flex items-center gap-3">
                        <Book size={16} />
                        SDK Docs
                    </div>
                    <ExternalLink size={14} />
                </a>
            </nav>
        </div>
    </div>
);
