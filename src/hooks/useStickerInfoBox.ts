import { useCallback, useState } from 'react';

import { type UseStickerInfoReturn, useStickerInfo } from './useStickerInfo';

interface StickerData {
    id: string;
    name: string;
    url: string;
    serverId?: string;
}

interface UseStickerInfoBoxReturn {
    selectedSticker: StickerData | null;
    infoBoxPosition: { x: number; y: number } | null;
    stickerInfo: UseStickerInfoReturn['sticker'];
    server: UseStickerInfoReturn['server'];
    showStickerInfo: (sticker: StickerData, event: React.MouseEvent) => void;
    closeInfoBox: () => void;
}

export const useStickerInfoBox = (): UseStickerInfoBoxReturn => {
    const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(
        null,
    );
    const [infoBoxPosition, setInfoBoxPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const { sticker: stickerInfo, server: serverInfo } = useStickerInfo({
        stickerId: selectedSticker?.id,
        serverId: selectedSticker?.serverId,
        enabled: !!selectedSticker,
    });

    const showStickerInfo = useCallback(
        (sticker: StickerData, event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const rect = (
                event.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const x = rect.left + rect.width / 2 - 128;
            const y = rect.bottom + 8;

            setSelectedSticker({
                id: sticker.id,
                name: sticker.name,
                url: sticker.url,
                serverId: sticker.serverId,
            });
            setInfoBoxPosition({ x, y });
        },
        [],
    );

    const closeInfoBox = useCallback(() => {
        setSelectedSticker(null);
        setInfoBoxPosition(null);
    }, []);

    return {
        selectedSticker,
        infoBoxPosition,
        stickerInfo,
        server: serverInfo,
        showStickerInfo,
        closeInfoBox,
    };
};
