import type { ReactNode } from 'react';

import { BadgeCheck, Calendar, Tag, Users } from 'lucide-react';

import type { Server } from '@/api/servers/servers.types';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';

interface AdminServerPreviewProps {
    server: Server & { deletedAt?: string };
    className?: string;
}

export const AdminServerPreview = ({
    server,
    className,
}: AdminServerPreviewProps): ReactNode => (
    <div
        className={`flex w-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-2xl sm:w-[340px] ${className || ''}`}
    >
        <Box className="relative h-[120px] w-full shrink-0 overflow-hidden bg-bg-secondary/30">
            {server.banner?.value && (
                <img
                    alt="Server Banner"
                    className="h-full w-full object-cover"
                    src={resolveApiUrl(server.banner.value) || ''}
                />
            )}
        </Box>

        <Box className="relative z-content -mt-[50px] px-4">
            <Box className="relative inline-block rounded-2xl bg-background p-1.5">
                <ServerIcon server={server as unknown as Server} size="xl" />
            </Box>
        </Box>

        <Box className="p-4 pt-2">
            <Box className="mb-4">
                <div className="flex items-center gap-2">
                    {server.verified && (
                        <BadgeCheck
                            className="shrink-0 text-primary"
                            size={24}
                            strokeWidth={2.5}
                        />
                    )}
                    <Heading
                        className="w-full truncate text-xl leading-tight font-bold"
                        level={2}
                    >
                        {server.name}
                    </Heading>
                </div>
                <Box className="font-mono text-sm font-medium text-muted-foreground select-text">
                    {server._id}
                </Box>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {server.deletedAt && (
                        <Box className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-danger uppercase ring-1 ring-danger/20">
                            Deleted
                        </Box>
                    )}
                </div>
            </Box>

            <Box className="my-3 h-px w-full bg-divider" />

            <Box className="mb-4 flex gap-4">
                <Box className="min-w-0 flex-1">
                    <Heading
                        className="mb-2 text-xs font-bold text-muted-foreground uppercase"
                        level={3}
                    >
                        Created
                    </Heading>
                    <Box className="flex items-center gap-2 text-sm text-foreground/80">
                        <Calendar className="shrink-0" size={14} />
                        <Text as="span" className="truncate">
                            {server.createdAt
                                ? new Date(server.createdAt).toLocaleDateString(
                                      'en-GB',
                                      {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                      },
                                  )
                                : 'Unknown'}
                        </Text>
                    </Box>
                </Box>

                <Box className="min-w-0 flex-1">
                    <Heading
                        className="mb-2 truncate text-xs font-bold text-muted-foreground uppercase"
                        level={3}
                    >
                        Members
                    </Heading>
                    <Box className="flex items-center gap-2 text-sm text-foreground/80">
                        <Users className="shrink-0" size={14} />
                        <Text
                            as="span"
                            className="truncate font-bold text-foreground"
                        >
                            {server.memberCount}
                        </Text>
                    </Box>
                </Box>
            </Box>

            {server.tags && server.tags.length > 0 && (
                <>
                    <Box className="my-3 h-px w-full bg-divider" />
                    <Box>
                        <Heading
                            className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            <Tag size={12} /> Tags
                        </Heading>
                        <div className="flex flex-wrap gap-1.5">
                            {server.tags.map((tag) => (
                                <Box
                                    className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/20"
                                    key={tag}
                                >
                                    {tag}
                                </Box>
                            ))}
                        </div>
                    </Box>
                </>
            )}
        </Box>
    </div>
);
