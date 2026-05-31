import { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { useResizable } from '@/hooks/useResizable';
import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileMemberList } from '@/store/slices/navSlice';
import { Input } from '@/ui/components/common/Input';
import { Resizer } from '@/ui/components/common/Resizer';
import { Box } from '@/ui/components/layout/Box';
import { DMSidebarSection } from '@/ui/components/sidebar/DMSidebarSection';
import { ServerSidebarSection } from '@/ui/components/sidebar/ServerSidebarSection';
import { cn } from '@/utils/cn';

/**
 * @description Tertiary sidebar displaying DM participants or Server members.
 */
interface TertiarySidebarProps {
    selectedFriendId?: null | string;
    selectedServerId?: null | string;
    ignoreUrlMatch?: boolean;
    onMobileClose?: () => void;
}

export const TertiarySidebar = ({
    selectedFriendId: selectedFriendIdOverride,
    selectedServerId: selectedServerIdOverride,
    ignoreUrlMatch,
    onMobileClose,
}: TertiarySidebarProps) => {
    const {
        selectedFriendId,
        selectedServerId,
        me,
        friend,
        serverDetails,
        members,
        isLoadingMembers,
        memberRoleMap,
        memberIconRoleMap,
        roles,
    } = useTertiarySidebarData({
        selectedFriendId: selectedFriendIdOverride,
        selectedServerId: selectedServerIdOverride,
        ignoreUrlMatch,
    });

    const dispatch = useAppDispatch();
    const showMobileMemberList = useAppSelector(
        (state): boolean => state.nav.showMobileMemberList,
    );

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect((): (() => void) | undefined => {
        if (isSearchOpen) {
            const timeoutId = setTimeout((): void => {
                searchInputRef.current?.focus();
            }, 100);
            return (): void => clearTimeout(timeoutId);
        }
    }, [isSearchOpen]);

    const { width, isResizing, handleMouseDown } = useResizable({
        initialWidth: 240,
        minWidth: 200,
        maxWidth: 480,
        storageKey: 'tertiary-sidebar-width',
        side: 'right',
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <Box
            as="aside"
            className={cn(
                'pride-glass relative flex h-full shrink-0 flex-col border-l border-border-subtle bg-[var(--tertiary-bg)]',
                'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
                'md:flex',
                'max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-[var(--z-index-top)] max-md:w-64 max-md:shadow-2xl',
                'max-md:transition-transform max-md:duration-300 max-md:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]',
                showMobileMemberList
                    ? 'max-md:translate-x-0'
                    : 'max-md:translate-x-full',
            )}
            style={{
                width: `${width}px`,
                minWidth: '200px',
                maxWidth: '480px',
            }}
        >
            <Resizer
                isResizing={isResizing}
                side="left"
                onMouseDown={handleMouseDown}
            />

            <Box
                className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
                ref={scrollContainerRef}
            >
                {(selectedServerId || showMobileMemberList) && (
                    <div
                        className={cn(
                            'flex h-12 shrink-0 items-center justify-between px-3',
                            selectedFriendId && 'md:hidden',
                        )}
                    >
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                            Members
                        </span>
                        <div className="flex items-center gap-1">
                            {selectedServerId && (
                                <button
                                    aria-label="Toggle search"
                                    className={cn(
                                        'p-1 text-muted-foreground transition-colors hover:text-foreground',
                                        isSearchOpen && 'text-primary',
                                    )}
                                    onClick={(): void => {
                                        setIsSearchOpen(!isSearchOpen);
                                        if (isSearchOpen) setSearchQuery('');
                                    }}
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                            )}
                            {showMobileMemberList && (
                                <button
                                    aria-label="Close member list"
                                    className="p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                                    onClick={(): void | {
                                        payload: undefined;
                                        type: 'nav/toggleMobileMemberList';
                                    } =>
                                        onMobileClose
                                            ? onMobileClose()
                                            : dispatch(toggleMobileMemberList())
                                    }
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {isSearchOpen && selectedServerId && (
                        <motion.div
                            animate={{ height: 'auto', opacity: 1 }}
                            className="pride-glass shrink-0 overflow-hidden border-b border-border-subtle bg-bg-subtle/50"
                            exit={{ height: 0, opacity: 0 }}
                            initial={{ height: 0, opacity: 0 }}
                        >
                            <div className="p-3">
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Search (supports regex /pattern/)..."
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChange={(e): void =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Box className="flex min-w-0 flex-col gap-4 p-3">
                    {/* DM Context */}
                    {selectedFriendId && friend && me && (
                        <DMSidebarSection friend={friend} me={me} />
                    )}

                    {/* Server Context */}
                    {selectedServerId && (
                        <ServerSidebarSection
                            isLoading={isLoadingMembers}
                            memberIconRoleMap={memberIconRoleMap}
                            memberRoleMap={memberRoleMap}
                            members={members}
                            roles={roles}
                            scrollRef={scrollContainerRef}
                            searchQuery={searchQuery}
                            serverDetails={serverDetails}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
