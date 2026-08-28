import React, { useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { ModalCloseButton } from '@/ui/components/common/ModalCloseButton';
import { cn } from '@/utils/cn';

import { SettingsSidebar } from './SettingsSidebar';

const AccessibilitySettings = React.lazy(() =>
    import('./AccessibilitySettings').then((m) => ({
        default: m.AccessibilitySettings,
    })),
);

const AccountSettings = React.lazy(() =>
    import('./AccountSettings').then((m) => ({ default: m.AccountSettings })),
);

const AppearanceSettings = React.lazy(() =>
    import('./AppearanceSettings').then((m) => ({
        default: m.AppearanceSettings,
    })),
);

const BlockingSettings = React.lazy(() =>
    import('./BlockingSettings').then((m) => ({ default: m.BlockingSettings })),
);

const DeveloperSettings = React.lazy(() =>
    import('./DeveloperSettings').then((m) => ({
        default: m.DeveloperSettings,
    })),
);

const StandingSettings = React.lazy(() =>
    import('./StandingSettings').then((m) => ({ default: m.StandingSettings })),
);

const NotificationSettings = React.lazy(() =>
    import('./NotificationSettings').then((m) => ({
        default: m.NotificationSettings,
    })),
);

const KeybindSettings = React.lazy(() =>
    import('./KeybindSettings').then((m) => ({
        default: m.KeybindSettings,
    })),
);

const AvatarDecorationsSettings = React.lazy(() =>
    import('./AvatarDecorationsSettings').then((m) => ({
        default: m.AvatarDecorationsSettings,
    })),
);

const PrivacySettings = React.lazy(() =>
    import('./PrivacySettings').then((m) => ({ default: m.PrivacySettings })),
);

const ActiveSessionsSettings = React.lazy(() =>
    import('./ActiveSessionsSettings').then((m) => ({
        default: m.ActiveSessionsSettings,
    })),
);

const WebsiteConnectionsSettings = React.lazy(() =>
    import('./WebsiteConnectionsSettings').then((m) => ({
        default: m.WebsiteConnectionsSettings,
    })),
);

const SecuritySettings = React.lazy(() =>
    import('./SecuritySettings').then((m) => ({
        default: m.SecuritySettings,
    })),
);

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionOverride?: string | null;
}

const SECTION_URL_MAP: Record<string, string> = {
    'my-account': 'account',
    connections: 'connections',
    security: 'security',
    sessions: 'sessions',
    appearance: 'appearance',
    decorations: 'decorations',
    accessibility: 'accessibility',
    privacy: 'privacy',
    blocking: 'blocking',
    standing: 'standing',
    notifications: 'notifications',
    keybinds: 'keybinds',
    developer: 'developer',
};

const SECTION_ID_TO_URL: Record<string, string> = {
    account: 'my-account',
    connections: 'connections',
    security: 'security',
    sessions: 'sessions',
    appearance: 'appearance',
    decorations: 'decorations',
    accessibility: 'accessibility',
    privacy: 'privacy',
    blocking: 'blocking',
    standing: 'standing',
    notifications: 'notifications',
    keybinds: 'keybinds',
    developer: 'developer',
};

const SettingsSectionLoading = () => (
    <div className="flex min-h-[240px] flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
    </div>
);

export const SettingsModal = ({
    isOpen,
    onClose,
    sectionOverride,
}: SettingsModalProps) => {
    const location = useLocation();
    const navigate = useNavigate();

    const urlSegment = location.pathname.split('/').pop() ?? '';
    const routeSection = SECTION_URL_MAP[urlSegment] ?? 'account';

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
    const [pendingSection, setPendingSection] = useState<string | null>(null);

    const activeSection = pendingSection ?? sectionOverride ?? routeSection;
    const isSectionLoading =
        (pendingSection !== null && pendingSection !== routeSection) ||
        (sectionOverride !== null &&
            sectionOverride !== undefined &&
            sectionOverride !== routeSection);

    const handleSetSection = (sectionId: string): void => {
        setPendingSection(sectionId);
        setIsMobileSidebarOpen(false);
        const urlPath = SECTION_ID_TO_URL[sectionId] ?? 'my-account';
        void navigate(`/chat/@setting/${urlPath}`, { replace: true });
    };

    if (pendingSection !== null && pendingSection === routeSection) {
        setPendingSection(null);
    }

    return (
        <Modal
            mobileFullScreen
            noPadding
            className="flex flex-row overflow-hidden bg-background p-0 md:h-[92vh] md:max-h-[900px] md:w-[98%] md:max-w-[1500px]"
            isOpen={isOpen}
            showCloseButton={false}
            onClose={onClose}
        >
            <div className="flex h-full w-full">
                <div
                    className={cn(
                        'h-full shrink-0',
                        isMobileSidebarOpen
                            ? 'w-full md:w-auto'
                            : 'hidden md:block',
                    )}
                >
                    <SettingsSidebar
                        activeSection={activeSection}
                        setActiveSection={handleSetSection}
                        onClose={onClose}
                    />
                </div>

                <div
                    className={cn(
                        'relative flex h-full flex-1 flex-col overflow-hidden bg-background',
                        isMobileSidebarOpen ? 'hidden md:flex' : 'flex',
                    )}
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-6 py-5">
                        <div className="flex items-center gap-2">
                            <div className="md:hidden">
                                <IconButton
                                    className="text-muted-foreground hover:bg-bg-subtle hover:text-foreground"
                                    icon={ChevronLeft}
                                    iconSize={24}
                                    onClick={(): void => {
                                        setIsMobileSidebarOpen(true);
                                    }}
                                />
                            </div>
                            <Heading
                                className="m-0"
                                level={2}
                                variant="section"
                            >
                                Settings
                            </Heading>
                        </div>
                        <ModalCloseButton onClick={onClose} />
                    </div>

                    <div
                        className="scrollbar-thin scrollbar-thumb-bg-secondary scrollbar-track-transparent flex-1 overflow-y-auto p-6"
                        key={activeSection}
                    >
                        {isSectionLoading ? (
                            <SettingsSectionLoading />
                        ) : (
                            <React.Suspense
                                fallback={<SettingsSectionLoading />}
                            >
                                {activeSection === 'account' ? (
                                    <AccountSettings />
                                ) : null}
                                {activeSection === 'connections' ? (
                                    <WebsiteConnectionsSettings />
                                ) : null}
                                {activeSection === 'security' ? (
                                    <SecuritySettings />
                                ) : null}
                                {activeSection === 'sessions' ? (
                                    <ActiveSessionsSettings />
                                ) : null}
                                {activeSection === 'appearance' ? (
                                    <AppearanceSettings />
                                ) : null}
                                {activeSection === 'accessibility' ? (
                                    <AccessibilitySettings />
                                ) : null}
                                {activeSection === 'privacy' ? (
                                    <PrivacySettings />
                                ) : null}
                                {activeSection === 'blocking' ? (
                                    <BlockingSettings />
                                ) : null}
                                {activeSection === 'standing' ? (
                                    <StandingSettings />
                                ) : null}
                                {activeSection === 'notifications' ? (
                                    <NotificationSettings />
                                ) : null}
                                {activeSection === 'keybinds' ? (
                                    <KeybindSettings />
                                ) : null}
                                {activeSection === 'developer' ? (
                                    <DeveloperSettings />
                                ) : null}
                                {activeSection === 'decorations' ? (
                                    <AvatarDecorationsSettings />
                                ) : null}
                            </React.Suspense>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
