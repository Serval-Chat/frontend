import React from 'react';

import type { Category, Channel } from '@/api/servers/servers.types';
import { ConfirmLinkModal } from '@/ui/components/common/ConfirmLinkModal';

const CategorySettingsModal = React.lazy(() =>
    import('./modals/CategorySettingsModal').then((m) => ({
        default: m.CategorySettingsModal,
    })),
);

const ChannelSettingsModal = React.lazy(() =>
    import('./modals/ChannelSettingsModal').then((m) => ({
        default: m.ChannelSettingsModal,
    })),
);

const CreateCategoryModal = React.lazy(() =>
    import('./modals/CreateCategoryModal').then((m) => ({
        default: m.CreateCategoryModal,
    })),
);

const CreateChannelModal = React.lazy(() =>
    import('./modals/CreateChannelModal').then((m) => ({
        default: m.CreateChannelModal,
    })),
);

const LeaveServerModal = React.lazy(() =>
    import('./modals/LeaveServerModal').then((m) => ({
        default: m.LeaveServerModal,
    })),
);

interface ChannelListModalsProps {
    settingsCategory: Category | null;
    settingsChannel: Channel | null;
    selectedLinkChannel: Channel | null;
    createModalOpen: boolean;
    createCategoryModalOpen: boolean;
    createCategoryId: string | null;
    isLeaveModalOpen: boolean;
    selectedServerId: string | null;
    serverName: string;
    onCloseCategorySettings: () => void;
    onCloseChannelSettings: () => void;
    onCloseCreateChannel: () => void;
    onCloseCreateCategory: () => void;
    onCloseLink: () => void;
    onConfirmLink: () => void;
    onCloseLeave: () => void;
}

export const ChannelListModals = ({
    settingsCategory,
    settingsChannel,
    selectedLinkChannel,
    createModalOpen,
    createCategoryModalOpen,
    createCategoryId,
    isLeaveModalOpen,
    selectedServerId,
    serverName,
    onCloseCategorySettings,
    onCloseChannelSettings,
    onCloseCreateChannel,
    onCloseCreateCategory,
    onCloseLink,
    onConfirmLink,
    onCloseLeave,
}: ChannelListModalsProps): React.ReactNode => (
    <>
        {settingsCategory ? (
            <React.Suspense fallback={null}>
                <CategorySettingsModal
                    category={settingsCategory}
                    isOpen={!!settingsCategory}
                    onClose={onCloseCategorySettings}
                />
            </React.Suspense>
        ) : null}

        {settingsChannel ? (
            <React.Suspense fallback={null}>
                <ChannelSettingsModal
                    channel={settingsChannel}
                    isOpen={!!settingsChannel}
                    onClose={onCloseChannelSettings}
                />
            </React.Suspense>
        ) : null}

        {selectedServerId && createModalOpen ? (
            <React.Suspense fallback={null}>
                <CreateChannelModal
                    categoryId={createCategoryId}
                    isOpen={createModalOpen}
                    serverId={selectedServerId}
                    onClose={onCloseCreateChannel}
                />
            </React.Suspense>
        ) : null}

        {selectedServerId && createCategoryModalOpen ? (
            <React.Suspense fallback={null}>
                <CreateCategoryModal
                    isOpen={createCategoryModalOpen}
                    serverId={selectedServerId}
                    onClose={onCloseCreateCategory}
                />
            </React.Suspense>
        ) : null}

        {selectedLinkChannel ? (
            <ConfirmLinkModal
                isOpen={!!selectedLinkChannel}
                url={selectedLinkChannel.link || '#'}
                onClose={onCloseLink}
                onConfirm={onConfirmLink}
            />
        ) : null}

        {isLeaveModalOpen ? (
            <React.Suspense fallback={null}>
                <LeaveServerModal
                    isOpen={isLeaveModalOpen}
                    serverId={selectedServerId || ''}
                    serverName={serverName}
                    onClose={onCloseLeave}
                />
            </React.Suspense>
        ) : null}
    </>
);
