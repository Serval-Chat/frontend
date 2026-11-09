import { Server } from 'lucide-react';

import type { AdminExtendedUser } from '@/types/admin';
import { Box } from '@/ui/primitives/Box';
import { Heading } from '@/ui/primitives/Heading';
import { Text } from '@/ui/primitives/Text';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';

export const ProfileCardAdminView = ({
    adminData,
}: {
    adminData: AdminExtendedUser;
}) => (
    <Box className="mt-2 space-y-4 border-t border-divider pt-4">
        <Heading
            className="mb-2 text-[10px] font-black tracking-[0.2em] text-danger uppercase"
            level={3}
        >
            Administrative View
        </Heading>

        <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-2">
                <Text
                    className="block text-[9px]"
                    tracking="tight"
                    transform="uppercase"
                    variant="muted"
                    weight="bold"
                >
                    Warnings
                </Text>
                <Text
                    className={cn(
                        'text-sm font-black',
                        adminData.warningCount > 0
                            ? 'text-caution'
                            : 'text-foreground',
                    )}
                >
                    {adminData.warningCount}
                </Text>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 p-2">
                <Text
                    className="block text-[9px]"
                    tracking="tight"
                    transform="uppercase"
                    variant="muted"
                    weight="bold"
                >
                    Account Status
                </Text>
                <Text size="sm" variant="success" weight="black">
                    Active
                </Text>
            </div>
        </div>

        {adminData.banExpiry !== undefined && adminData.banExpiry !== '' ? (
            <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                <Text tracking="tight" transform="uppercase" weight="bold">
                    Banned Until:
                </Text>
                <Text className="mt-0.5 block" weight="black">
                    {new Date(adminData.banExpiry).toLocaleString(APP_LOCALE)}
                </Text>
            </div>
        ) : null}

        <Box>
            <Heading
                className="mb-2 flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-muted-foreground uppercase"
                level={3}
            >
                <Server size={10} /> Joined Servers ({adminData.servers.length})
            </Heading>
            <Box className="custom-scrollbar max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                {adminData.servers.map((server) => (
                    <div
                        className="flex items-center gap-2 rounded-lg border border-border-subtle/50 bg-bg-secondary/30 p-1.5 transition-colors hover:bg-bg-secondary/50"
                        key={server.id}
                    >
                        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-bg-secondary">
                            {server.icon ? (
                                <img
                                    alt={server.name}
                                    className="h-full w-full object-cover"
                                    src={resolveApiUrl(server.icon) ?? ''}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-black text-primary">
                                    {server.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] leading-tight font-bold">
                                {server.name}
                                {server.isOwner ? (
                                    <Text
                                        className="ml-1 text-[8px]"
                                        transform="uppercase"
                                        variant="caution"
                                        weight="black"
                                    >
                                        Owner
                                    </Text>
                                ) : null}
                            </div>
                            <div className="text-[9px] font-medium text-muted-foreground uppercase">
                                Joined{' '}
                                {new Date(server.joinedAt).toLocaleDateString(
                                    APP_LOCALE,
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </Box>
        </Box>
    </Box>
);
