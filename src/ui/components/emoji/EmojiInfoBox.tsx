import React, { useRef } from 'react';

import { motion } from 'framer-motion';

import type { Server } from '@/api/servers/servers.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface EmojiInfoBoxProps {
    emoji: {
        id: string;
        name: string;
        url: string;
        serverId?: string;
    };
    server?: Server | null;
    className?: string;
    position?: { x: number; y: number };
}

export const EmojiInfoBox: React.FC<EmojiInfoBoxProps> = ({
    emoji,
    server,
    className,
    position,
}) => {
    const isUnknownServer = !server;
    const infoBoxRef = useRef<HTMLDivElement>(null);

    const smartPosition = useSmartPosition({
        isOpen: true,
        elementRef: infoBoxRef,
        position,
        padding: 16,
    });

    return (
        <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                'z-[99999999] flex w-64 flex-col gap-3 rounded-lg border border-divider bg-background p-3 shadow-xl',
                className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={infoBoxRef}
            style={{
                position: 'fixed',
                left: `${smartPosition.x}px`,
                top: `${smartPosition.y}px`,
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <Box className="flex items-center gap-3">
                <Box className="flex h-12 w-12 items-center justify-center rounded-md bg-bg-subtle">
                    <img
                        alt={emoji.name}
                        className="h-10 w-10 object-contain"
                        src={resolveApiUrl(emoji.url) || ''}
                    />
                </Box>
                <Box className="flex min-w-0 flex-1 flex-col">
                    <Text className="truncate font-semibold text-foreground">
                        :{emoji.name}:
                    </Text>
                    <Text className="truncate text-sm text-muted-foreground">
                        {isUnknownServer ? 'Unknown Server' : server?.name}
                    </Text>
                </Box>
            </Box>

            <Box className="flex items-center gap-2 border-t border-divider/50 pt-3">
                {isUnknownServer ? (
                    <>
                        <Box className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                            <Text className="text-xs font-bold text-muted-foreground">
                                ?
                            </Text>
                        </Box>
                        <Text className="text-sm text-muted-foreground">
                            Server information unavailable
                        </Text>
                    </>
                ) : (
                    <>
                        <ServerIcon
                            className="!rounded-sm"
                            server={server}
                            size="xs"
                        />
                        <Box className="flex min-w-0 flex-1 flex-col">
                            <Text className="truncate text-sm font-medium text-foreground">
                                {server?.name}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                                Custom Emoji
                            </Text>
                        </Box>
                    </>
                )}
            </Box>
        </motion.div>
    );
};
