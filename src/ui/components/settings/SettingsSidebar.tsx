import {
    Bell,
    Eye,
    Keyboard,
    Palette,
    Shield,
    ShieldAlert,
    User,
    X,
} from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';

interface SettingsSidebarProps {
    activeSection: string;
    onClose: () => void;
    setActiveSection: (section: string) => void;
}

const SETTINGS_SECTIONS = [
    { id: 'account', label: 'My Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'blocking', label: 'Blocking', icon: Shield },
    { id: 'standing', label: 'Standing', icon: ShieldAlert },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'keybinds', label: 'Keybinds', icon: Keyboard },
    { id: 'developer', label: 'Developer', icon: ShieldAlert },
];

export const SettingsSidebar = ({
    activeSection,
    onClose,
    setActiveSection,
}: SettingsSidebarProps) => (
    <div className="flex w-full shrink-0 flex-col gap-1 overflow-y-auto border-r border-border-subtle bg-[var(--secondary-bg)] p-3 md:w-[200px]">
        <div className="mb-2 flex items-center justify-between border-b border-border-subtle px-2 pb-3 md:hidden">
            <Heading className="m-0" level={2} variant="section">
                Settings
            </Heading>
            <IconButton
                className="border border-border-subtle text-muted-foreground hover:bg-danger-muted hover:text-danger"
                icon={X}
                iconSize={20}
                onClick={onClose}
            />
        </div>

        {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
                <Button
                    className={`w-full justify-start px-3 py-2.5 text-sm transition-all duration-200
                            ${
                                isActive
                                    ? 'border-transparent bg-bg-subtle font-semibold text-foreground'
                                    : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground'
                            }`}
                    key={section.id}
                    variant={isActive ? 'normal' : 'ghost'}
                    onClick={(): void => setActiveSection(section.id)}
                >
                    <span className="flex items-center gap-2.5">
                        <Icon size={18} />
                        {section.label}
                    </span>
                </Button>
            );
        })}
    </div>
);
