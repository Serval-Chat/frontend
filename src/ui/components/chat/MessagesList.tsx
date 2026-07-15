import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronRight } from 'lucide-react';

import type {
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import { jumpDebug } from '@/utils/jumpDebug';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessageItem } from '@/ui/components/chat/MessageItem';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';

import { ChatSkeleton } from './ChatSkeleton';

export interface MessagesListHandle {
    scrollToBottom: () => void;
}

export interface MessagesListProps {
    ref?: React.Ref<MessagesListHandle>;
    messages: ProcessedChatMessage[];
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    onLoadMoreNewer?: () => void;
    hasMoreNewer?: boolean;
    isLoadingMoreNewer?: boolean;
    onReplyClick?: (messageId: string) => void;
    onReplyToMessage?: (message: ProcessedChatMessage) => void;
    onAtBottomChange?: (isAtBottom: boolean) => void;
    activeHighlightId?: string | null;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    me?: User;
    serverDetails?: Server;
    hasPermission?: (permission: keyof RolePermissions) => boolean;
    isOwner?: boolean;
    fullMemberMap?: Map<string, ServerMember>;
    userRolesMap?: Map<string, Role[]>;
    roleMap?: Map<string, Role>;
}

export const MessagesList = React.memo(
    ({
        ref,
        messages,
        onLoadMore,
        hasMore,
        isLoading,
        isLoadingMore,
        onLoadMoreNewer,
        hasMoreNewer,
        isLoadingMoreNewer,
        onReplyClick,
        onReplyToMessage,
        onAtBottomChange,
        activeHighlightId,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
        me,
        serverDetails,
        hasPermission,
        isOwner,
        fullMemberMap,
        userRolesMap,
        roleMap,
    }: MessagesListProps) => {
        const blocks = useAppSelector(
            (state): Record<string, number> => state.blocking.blocks,
        );
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [isAtBottom, setIsAtBottom] = useState(true);
        const onAtBottomChangeRef = useRef(onAtBottomChange);
        useLayoutEffect((): void => {
            onAtBottomChangeRef.current = onAtBottomChange;
        });
        const lastScrollHeightRef = useRef<number>(0);
        const isPrependingScrollRef = useRef(false);
        // true only during a jump-to-message settle - unlike isPrependingScrollRef
        // (also raised by the virtualizer's routine measurement adjustments),
        // this never flips true on the settle's transient scroll positions.
        const jumpSettlingRef = useRef(false);
        const loadMoreCooldownRef = useRef(false);
        const [highlightId, setInternalHighlightId] = useState<string | null>(
            null,
        );

        const [, startTransitionHighlight] = useTransition();

        useEffect((): void => {
            startTransitionHighlight((): void => {
                setInternalHighlightId(activeHighlightId ?? null);
            });
        }, [activeHighlightId]);

        useEffect((): (() => void) | undefined => {
            if (!isLoadingMore) {
                const t = setTimeout((): void => {
                    loadMoreCooldownRef.current = false;
                }, 100);
                return (): void => {
                    clearTimeout(t);
                };
            }
        }, [isLoadingMore]);

        const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
            new Set(),
        );
        const isAtBottomRef = useRef(isAtBottom);
        // live mirror of activeHighlightId for the ref-only scroll callbacks: while
        // a target is active we're browsing a historical window, so the
        // follow-newest-message auto-pin must stay off.
        const activeHighlightIdRef = useRef(activeHighlightId);
        useLayoutEffect((): void => {
            activeHighlightIdRef.current = activeHighlightId;
        });

        useEffect((): void => {
            onAtBottomChangeRef.current?.(isAtBottom);
        }, [isAtBottom]);

        // the list is kept invisible until its initial anchor has settled, so
        // the estimate -> real-measurement height corrections that happen right
        // after a channel switch never show up as visible jitter.
        const [hasSettled, setHasSettled] = useState(false);
        const hasSettledRef = useRef(false);
        const settleRafRef = useRef<number | null>(null);
        const settleFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(
            null,
        );

        const reveal = useCallback((): void => {
            if (settleFailsafeRef.current !== null) {
                clearTimeout(settleFailsafeRef.current);
                settleFailsafeRef.current = null;
            }
            if (hasSettledRef.current) return;
            hasSettledRef.current = true;
            setHasSettled(true);
        }, []);

        type VirtualItemData =
            | { type: 'message'; message: ProcessedChatMessage }
            | {
                  type: 'blocked-group';
                  messages: ProcessedChatMessage[];
                  id: string;
              }
            | { type: 'loader-older' }
            | { type: 'loader-newer' }
            | { type: 'spacer' };

        const virtualItems = useMemo((): VirtualItemData[] => {
            const items: VirtualItemData[] = [];

            if (hasMore) {
                items.push({ type: 'loader-older' });
            }

            let currentBlockedGroup: ProcessedChatMessage[] = [];

            const flushBlockedGroup = (): void => {
                if (currentBlockedGroup.length === 0) return;
                items.push({
                    type: 'blocked-group',
                    messages: [...currentBlockedGroup],
                    // safe: guarded by the length === 0 early-return above.
                    id: `blocked-${currentBlockedGroup[0]!.id}`,
                });
                currentBlockedGroup = [];
            };

            for (const msg of messages) {
                const senderBlocks = blocks[msg.senderId] || 0;
                const isSenderBlocked = !!(
                    senderBlocks & BlockFlags.HIDE_MESSAGES
                );

                const replyToSenderId = msg.replyTo?.user?.id;
                const isReplyToBlocked =
                    replyToSenderId &&
                    !!(
                        (blocks[replyToSenderId] || 0) & BlockFlags.HIDE_REPLIES
                    );

                if (isSenderBlocked || isReplyToBlocked) {
                    currentBlockedGroup.push(msg);
                } else {
                    flushBlockedGroup();
                    items.push({ type: 'message', message: msg });
                }
            }

            flushBlockedGroup();

            if (hasMoreNewer) {
                items.push({ type: 'loader-newer' });
            }

            items.push({ type: 'spacer' });

            return items;
        }, [messages, blocks, hasMore, hasMoreNewer]);

        const [, startTransitionGroup] = useTransition();
        const virtualItemsRef = useRef(virtualItems);
        const didApplyInitialScrollRef = useRef(false);
        useLayoutEffect((): void => {
            virtualItemsRef.current = virtualItems;
        }, [virtualItems]);

        const scrollToFn = useCallback(
            (
                offset: number,
                options: {
                    behavior?: ScrollBehavior;
                    adjustments?: number;
                },
            ): void => {
                const container = scrollContainerRef.current;
                if (!container) return;
                const toOffset = offset + (options.adjustments ?? 0);
                if (options.adjustments !== undefined) {
                    isPrependingScrollRef.current = true;
                    container.scrollTop = toOffset;
                    requestAnimationFrame((): void => {
                        isPrependingScrollRef.current = false;
                    });
                } else if (options.behavior === 'smooth') {
                    container.scrollTo({
                        top: toOffset,
                        behavior: 'smooth',
                    });
                } else {
                    container.scrollTop = toOffset;
                }
            },
            [],
        );

        const rowVirtualizer = useVirtualizer({
            count: virtualItems.length,
            getScrollElement: (): HTMLDivElement | null =>
                scrollContainerRef.current,
            scrollToFn,
            estimateSize: useCallback((index: number): number => {
                const item = virtualItemsRef.current[index];
                if (!item) return 100;
                if (
                    item.type === 'loader-older' ||
                    item.type === 'loader-newer'
                )
                    return 60;
                if (item.type === 'spacer') return 22;
                if (item.type === 'blocked-group') return 40;

                if (item.type === 'message') {
                    // keep estimates close to reality: over-estimating (the old
                    // embed=350/attachment=400/cap=2000) pushes computed offsets
                    // far from the truth, so scrollToIndex/jump-to-message miss.
                    let estimated = 72;

                    if (item.message.text) {
                        estimated +=
                            Math.floor(item.message.text.length / 60) * 18;
                    }
                    if (item.message.embeds?.length) {
                        estimated += item.message.embeds.length * 140;
                    }
                    if (item.message.attachments?.length) {
                        estimated += item.message.attachments.length * 220;
                    }
                    if (item.message.poll) {
                        estimated +=
                            120 + item.message.poll.options.length * 32;
                    }

                    return Math.min(estimated, 900);
                }

                return 100;
            }, []),
            getItemKey: useCallback(
                (index: number): string | number => {
                    const item = virtualItems[index];
                    if (!item) return index;
                    if (item.type === 'message') return item.message.id;
                    if (item.type === 'blocked-group') return item.id;
                    return item.type;
                },
                [virtualItems],
            ),
            initialOffset: (): number =>
                activeHighlightId ? 0 : Number.MAX_SAFE_INTEGER,
            overscan: 10,
        });
        const measureFrameRef = useRef<number | null>(null);
        const requestMeasure = useCallback((): void => {
            if (measureFrameRef.current !== null) return;

            measureFrameRef.current = requestAnimationFrame((): void => {
                measureFrameRef.current = null;

                const container = scrollContainerRef.current;
                if (
                    container &&
                    isAtBottomRef.current &&
                    !jumpSettlingRef.current &&
                    !activeHighlightIdRef.current
                ) {
                    jumpDebug('PIN requestMeasure', {
                        scrollTop: container.scrollTop,
                        scrollHeight: container.scrollHeight,
                    });
                    rowVirtualizer.scrollToIndex(
                        virtualItemsRef.current.length - 1,
                        { align: 'end' },
                    );
                    // clamp to the true DOM bottom in case late measurements
                    // (images/embeds) grew the list past the estimated offset.
                    container.scrollTop = container.scrollHeight;
                }
            });
        }, [rowVirtualizer]);

        useEffect(
            (): (() => void) => (): void => {
                if (measureFrameRef.current !== null) {
                    cancelAnimationFrame(measureFrameRef.current);
                }
            },
            [],
        );
        const toggleGroup = useCallback((groupId: string): void => {
            startTransitionGroup((): void => {
                setExpandedGroups((prev): Set<string> => {
                    const next = new Set(prev);
                    if (next.has(groupId)) {
                        next.delete(groupId);
                    } else {
                        next.add(groupId);
                    }
                    return next;
                });
            });
        }, []);

        const onReplyClickRef = useRef(onReplyClick);
        useLayoutEffect((): void => {
            onReplyClickRef.current = onReplyClick;
        });

        const handleReplyClick = useCallback(
            (messageId: string): void => {
                const index = virtualItemsRef.current.findIndex(
                    (item): boolean =>
                        item.type === 'message' &&
                        item.message.id === messageId,
                );
                if (index !== -1) {
                    rowVirtualizer.scrollToIndex(index, {
                        align: 'center',
                        behavior: 'smooth',
                    });
                    startTransitionHighlight((): void => {
                        setInternalHighlightId(messageId);
                    });
                }

                onReplyClickRef.current?.(messageId);
            },
            [rowVirtualizer],
        );

        const handleScroll = useCallback((): void => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const { scrollTop, scrollHeight, clientHeight } = container;
            // Track the real at-bottom state even during the virtualizer's routine
            // measurement scroll-adjustments (which also raise isPrependingScrollRef) -
            // skipping it there would leave isAtBottomRef stale-true and let the
            // pin-to-bottom paths yank the viewport mid-scroll. Suppressed only
            // during a jump settle, whose transient positions aren't "at bottom".
            if (!jumpSettlingRef.current) {
                const nextIsAtBottom =
                    scrollHeight - scrollTop - clientHeight < 5;
                if (isAtBottomRef.current !== nextIsAtBottom) {
                    jumpDebug('isAtBottom ->', {
                        nextIsAtBottom,
                        scrollTop,
                        scrollHeight,
                        clientHeight,
                    });
                    isAtBottomRef.current = nextIsAtBottom;
                    setIsAtBottom(nextIsAtBottom);
                }
            }

            // ...but a programmatic scroll (prepend compensation, jump settle)
            // must never be read as the user reaching the top and trigger a
            // history load.
            if (isPrependingScrollRef.current) return;

            if (scrollTop > 500) {
                loadMoreCooldownRef.current = false;
            }

            if (
                scrollTop < 200 &&
                hasMore &&
                !isLoadingMore &&
                !loadMoreCooldownRef.current
            ) {
                loadMoreCooldownRef.current = true;
                onLoadMore?.();
            }
        }, [hasMore, isLoadingMore, onLoadMore]);

        const scrollToBottom = useCallback((): void => {
            rowVirtualizer.scrollToIndex(virtualItemsRef.current.length - 1, {
                align: 'end',
                behavior: 'smooth',
            });
            isAtBottomRef.current = true;
            setIsAtBottom(true);
        }, [rowVirtualizer]);

        useImperativeHandle(
            ref,
            (): MessagesListHandle => ({ scrollToBottom }),
            [scrollToBottom],
        );

        useEffect((): void => {
            const container = scrollContainerRef.current;
            if (!container) return;

            if (
                container.scrollTop < 200 &&
                hasMore &&
                !isLoadingMore &&
                !loadMoreCooldownRef.current
            ) {
                loadMoreCooldownRef.current = true;
                onLoadMore?.();
            }
        }, [messages, hasMore, isLoadingMore, onLoadMore]);

        const totalSize = rowVirtualizer.getTotalSize();

        const prevFirstMessageIdRef = useRef<string | null>(null);
        const prevLastItemKeyRef = useRef<string | number | null>(null);
        const prevActiveHighlightRef = useRef<string | null | undefined>(
            activeHighlightId,
        );
        // the highlight id the settle loop has actually centred on. A jump is
        // "in progress" until this catches up to activeHighlightId - used by the
        // layout effect below to hold the viewport across the transient renders
        // of a jump instead of misreading the fresh window as a prepend.
        const lastScrolledIdRef = useRef<string | null>(null);

        // keeps the viewport anchored to the newest message before every paint,
        // so opening a channel lands straight at the bottom (no scroll-through
        // of older messages) and stays pinned while async content settles.
        const pinToBottom = useCallback((): void => {
            const container = scrollContainerRef.current;
            if (!container) return;
            jumpDebug('PIN pinToBottom');
            rowVirtualizer.scrollToIndex(virtualItemsRef.current.length - 1, {
                align: 'end',
            });
            container.scrollTop = container.scrollHeight;
            isAtBottomRef.current = true;
            setIsAtBottom(true);
        }, [rowVirtualizer]);

        // holds the list hidden and pinned to the bottom until its measured
        // height stops changing for a couple of frames (or a short cap), then
        // reveals it - so the initial measurement pass is never seen.
        const startSettle = useCallback((): void => {
            if (hasSettledRef.current || settleRafRef.current !== null) return;
            // guarantee the list is never left hidden, even if the rAF loop is
            // interrupted for any reason.
            if (settleFailsafeRef.current === null) {
                settleFailsafeRef.current = setTimeout((): void => {
                    settleFailsafeRef.current = null;
                    reveal();
                }, 1000);
            }
            let lastHeight = -1;
            let stableFrames = 0;
            let frames = 0;
            const tick = (): void => {
                const container = scrollContainerRef.current;
                if (!container) {
                    settleRafRef.current = null;
                    reveal();
                    return;
                }
                if (isAtBottomRef.current) {
                    rowVirtualizer.scrollToIndex(
                        virtualItemsRef.current.length - 1,
                        { align: 'end' },
                    );
                    container.scrollTop = container.scrollHeight;
                }
                const height = container.scrollHeight;
                stableFrames = height === lastHeight ? stableFrames + 1 : 0;
                lastHeight = height;
                frames += 1;
                if (stableFrames >= 2 || frames >= 12) {
                    settleRafRef.current = null;
                    reveal();
                    return;
                }
                settleRafRef.current = requestAnimationFrame(tick);
            };
            settleRafRef.current = requestAnimationFrame(tick);
        }, [rowVirtualizer, reveal]);

        // drives a jump to a target message and reveals the list once centred.
        // Kept hidden (skeleton) for the whole settle so we can correct scrollTop
        // against the element's *real* geometry each frame, rather than the
        // virtualizer's estimate-based offset (which misses on big height
        // estimates for embeds/attachments).
        const settleToTarget = useCallback(
            (targetId: string): void => {
                if (settleRafRef.current !== null) {
                    cancelAnimationFrame(settleRafRef.current);
                    settleRafRef.current = null;
                }
                jumpSettlingRef.current = true;
                jumpDebug('settle START', { targetId });
                let stableFrames = 0;
                let frames = 0;
                let notRenderedFrames = 0;
                const stop = (reason: string): void => {
                    jumpDebug('settle STOP', {
                        reason,
                        frames,
                        scrollTop: scrollContainerRef.current?.scrollTop,
                    });
                    if (settleRafRef.current !== null) {
                        cancelAnimationFrame(settleRafRef.current);
                        settleRafRef.current = null;
                    }
                    if (settleFailsafeRef.current !== null) {
                        clearTimeout(settleFailsafeRef.current);
                        settleFailsafeRef.current = null;
                    }
                    isPrependingScrollRef.current = false;
                    jumpSettlingRef.current = false;
                    // we parked on an older message, definitively not at the
                    // bottom. Lock that in before the pin-to-bottom paths get a
                    // chance to read a stale at-bottom flag post-reveal.
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                    reveal();
                };
                // one failsafe, owned by the settle: if it can't converge, give up
                // cleanly via stop(), resetting all jump guards together. (A
                // separate reveal-only failsafe used to fire mid-settle and
                // un-freeze the guards while the loop was still fighting, letting
                // the pin paths ride growing content to the bottom.)
                if (settleFailsafeRef.current !== null) {
                    clearTimeout(settleFailsafeRef.current);
                }
                settleFailsafeRef.current = setTimeout((): void => {
                    stop('failsafe');
                }, 4000);
                const tick = (): void => {
                    frames += 1;
                    const container = scrollContainerRef.current;
                    if (!container || frames >= 90) {
                        stop(container ? 'frame-cap' : 'no-container');
                        return;
                    }
                    const index = virtualItemsRef.current.findIndex(
                        (item): boolean =>
                            item.type === 'message' &&
                            item.message.id === targetId,
                    );
                    if (index === -1) {
                        // the fresh window hasn't loaded the target yet - keep
                        // waiting rather than revealing on empty content.
                        settleRafRef.current = requestAnimationFrame(tick);
                        return;
                    }
                    // suppress handleScroll's at-bottom / load-older reactions
                    // while we drive the scroll programmatically.
                    isPrependingScrollRef.current = true;
                    const node = container.querySelector(
                        `[data-index="${index}"]`,
                    );
                    if (!(node instanceof HTMLElement)) {
                        notRenderedFrames += 1;
                        // first try the virtualizer's estimate-based hop to bring
                        // the row into the rendered range...
                        rowVirtualizer.scrollToIndex(index, { align: 'center' });
                        // ...but if the row never renders (embed-heavy windows
                        // over-estimate offsets and clamp toward the bottom), fall
                        // back to an estimate-independent proportional jump: index
                        // k of N sits at roughly k/N of the real measured height.
                        if (notRenderedFrames >= 3) {
                            const count = virtualItemsRef.current.length;
                            // use rendered scrollHeight, not getTotalSize(): during
                            // rapid measurement the virtualizer's total races ahead
                            // of the DOM height, and scrolling past the real
                            // scrollHeight just clamps to the bottom.
                            const total = container.scrollHeight;
                            const desired = Math.max(
                                0,
                                (index / Math.max(count, 1)) * total -
                                    container.clientHeight / 2,
                            );
                            jumpDebug('settle proportional-fallback', {
                                index,
                                count,
                                total,
                                desired,
                            });
                            container.scrollTop = desired;
                        }
                        settleRafRef.current = requestAnimationFrame(tick);
                        return;
                    }
                    notRenderedFrames = 0;
                    const contRect = container.getBoundingClientRect();
                    const nodeRect = node.getBoundingClientRect();
                    // pixels we'd need to scroll to put the element's centre on
                    // the viewport's centre.
                    const delta =
                        nodeRect.top -
                        contRect.top -
                        (container.clientHeight - nodeRect.height) / 2;
                    if (Math.abs(delta) <= 1) {
                        stableFrames += 1;
                        if (stableFrames >= 3) {
                            stop('centered');
                            return;
                        }
                    } else {
                        stableFrames = 0;
                        container.scrollTop = Math.max(
                            0,
                            container.scrollTop + delta,
                        );
                    }
                    jumpDebug('settle frame', {
                        frames,
                        index,
                        delta: Math.round(delta),
                        scrollTop: Math.round(container.scrollTop),
                    });
                    settleRafRef.current = requestAnimationFrame(tick);
                };
                settleRafRef.current = requestAnimationFrame(tick);
            },
            [rowVirtualizer, reveal],
        );

        useEffect(
            (): (() => void) => (): void => {
                if (settleRafRef.current !== null) {
                    cancelAnimationFrame(settleRafRef.current);
                    settleRafRef.current = null;
                }
                if (settleFailsafeRef.current !== null) {
                    clearTimeout(settleFailsafeRef.current);
                    settleFailsafeRef.current = null;
                }
            },
            [],
        );

        // drives the reveal. Once content is present (and not opened on a target
        // message) run the settle -> reveal cycle; otherwise reveal at once.
        // Lives in a passive effect rather than the one-shot initial-anchor
        // branch so it re-fires after StrictMode's mount/unmount/mount cycle
        // (where refs persist and that branch would be skipped the second time).
        useEffect((): void => {
            if (hasSettledRef.current || isLoading) return;
            if (activeHighlightId) {
                // jumping to a target: the reveal is driven by the target-settle
                // loop once the target is centred (never reveal early on the
                // window's transient empty state). Arm a failsafe so the list is
                // never left hidden if the target never shows up.
                if (settleFailsafeRef.current === null) {
                    settleFailsafeRef.current = setTimeout((): void => {
                        // reset the jump-suppression flags too: if the target
                        // never shows up (e.g. a cross-channel hit whose window
                        // doesn't contain it) settleToTarget never runs its own
                        // cleanup, and leaving these raised would freeze
                        // at-bottom detection and history loading for good.
                        isPrependingScrollRef.current = false;
                        jumpSettlingRef.current = false;
                        settleFailsafeRef.current = null;
                        reveal();
                    }, 1500);
                }
                return;
            }
            if (messages.length === 0) {
                // genuinely empty channel (no target): nothing to settle.
                reveal();
                return;
            }
            startSettle();
        }, [
            isLoading,
            messages.length,
            activeHighlightId,
            startSettle,
            reveal,
        ]);

        useLayoutEffect((): void => {
            const container = scrollContainerRef.current;
            if (!container || isLoading || virtualItems.length === 0) return;

            const firstMessage = virtualItems.find(
                (item): boolean => item.type === 'message',
            ) as { message: { id: string } } | undefined;
            const firstMessageId = firstMessage?.message.id ?? null;
            const hasContent = virtualItems.some(
                (item): boolean =>
                    item.type === 'message' || item.type === 'blocked-group',
            );

            const lastItem =
                [...virtualItems]
                    .reverse()
                    .find((item): boolean => item.type !== 'spacer') ??
                virtualItems.at(-1);
            // virtualItems.length === 0 already returned above, so there is
            // always at least one item here.
            if (!lastItem) return;
            const lastItemKey =
                lastItem.type === 'message'
                    ? lastItem.message.id
                    : lastItem.type === 'blocked-group'
                      ? lastItem.id
                      : lastItem.type;
            const newScrollHeight = container.scrollHeight;

            // detect the transition out of "viewing a linked/older message"
            // (e.g. the user hit "Jump to latest") so we re-anchor to bottom.
            const prevActiveHighlight = prevActiveHighlightRef.current;
            const leftHighlightMode =
                !!prevActiveHighlight && !activeHighlightId;
            prevActiveHighlightRef.current = activeHighlightId;

            // a jump is "in progress" from the moment a target is set until the
            // settle loop has centred on it, spanning every transient render in
            // between. Keying this off the durable "settled id" (not a one-render
            // prevActive != active edge) is what makes a *second* jump behave
            // like the first - a one-render edge gets consumed on a stale render
            // and the real window then looks like a prepend.
            const jumpInProgress =
                !!activeHighlightId &&
                lastScrolledIdRef.current !== activeHighlightId;

            // 1. first paint with real content for this conversation: land
            //    directly on the newest message, before the browser paints.
            if (!didApplyInitialScrollRef.current && hasContent) {
                didApplyInitialScrollRef.current = true;
                prevFirstMessageIdRef.current = firstMessageId;
                prevLastItemKeyRef.current = lastItemKey;
                lastScrollHeightRef.current = newScrollHeight;

                if (activeHighlightId) {
                    // opened on a target message: the highlight effect brings it
                    // into view; we are not pinned to the bottom.
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                } else {
                    pinToBottom();
                }
                // the reveal (settle vs. show-immediately) is driven by a
                // separate passive effect so it survives StrictMode's double
                // mount, where this one-shot branch would not run again.
                return;
            }

            const isPrepending =
                prevFirstMessageIdRef.current !== null &&
                firstMessageId !== null &&
                firstMessageId !== prevFirstMessageIdRef.current &&
                !leftHighlightMode &&
                !jumpInProgress;

            prevFirstMessageIdRef.current = firstMessageId;

            // 1b. jump in progress: hold the viewport steady and drop the
            //     at-bottom flag so no pin-to-bottom / prepend path fires. The
            //     settle loop owns the scroll and centres the target once it is
            //     in the DOM. Stays active across every render until centred.
            if (jumpInProgress) {
                if (isAtBottomRef.current) {
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                }
                lastScrollHeightRef.current = newScrollHeight;
                prevLastItemKeyRef.current = lastItemKey;
                return;
            }

            // 2. older history loaded at the top: hold the current viewport
            //    steady by compensating for the newly-added height.
            if (isPrepending && lastScrollHeightRef.current !== 0) {
                const heightDiff =
                    newScrollHeight - lastScrollHeightRef.current;
                if (heightDiff > 0) {
                    isPrependingScrollRef.current = true;
                    container.scrollTop += heightDiff;
                    requestAnimationFrame((): void => {
                        isPrependingScrollRef.current = false;
                    });
                }
                lastScrollHeightRef.current = newScrollHeight;
                prevLastItemKeyRef.current = lastItemKey;
                return;
            }

            // 3. returned to the latest messages after viewing older ones.
            if (leftHighlightMode) {
                prevLastItemKeyRef.current = lastItemKey;
                lastScrollHeightRef.current = newScrollHeight;
                pinToBottom();
                return;
            }

            // 4. pinned to the bottom: follow new messages and any height growth
            //    from late measurements / loading embeds without flashing. Only
            //    in the latest view - never while parked on a jump target, where
            //    the window's bottom is not the newest message.
            if (isAtBottomRef.current && !activeHighlightId) {
                jumpDebug('PIN layout-branch4', {
                    activeHighlightId,
                    lastScrolled: lastScrolledIdRef.current,
                });
                rowVirtualizer.scrollToIndex(virtualItems.length - 1, {
                    align: 'end',
                });
                container.scrollTop = container.scrollHeight;
                lastScrollHeightRef.current = container.scrollHeight;
                prevLastItemKeyRef.current = lastItemKey;
                return;
            }

            lastScrollHeightRef.current = newScrollHeight;
            prevLastItemKeyRef.current = lastItemKey;
        }, [
            virtualItems,
            totalSize,
            isLoading,
            activeHighlightId,
            rowVirtualizer,
            pinToBottom,
        ]);

        // hide the list the instant a jump begins (before the target window has
        // even loaded), so the reload's empty flash and the subsequent settle
        // are covered by the skeleton. settleToTarget reveals it once centred.
        const jumpHiddenForRef = useRef<string | null>(null);
        useEffect((): void => {
            if (!activeHighlightId) {
                jumpHiddenForRef.current = null;
                return;
            }
            if (jumpHiddenForRef.current === activeHighlightId) return;
            jumpHiddenForRef.current = activeHighlightId;
            if (hasSettledRef.current) {
                hasSettledRef.current = false;
                setHasSettled(false);
            }
        }, [activeHighlightId]);

        useEffect((): void => {
            if (!activeHighlightId) {
                lastScrolledIdRef.current = null;
                return;
            }

            if (lastScrolledIdRef.current === activeHighlightId) {
                return;
            }

            const index = virtualItems.findIndex(
                (item): boolean =>
                    item.type === 'message' &&
                    item.message.id === activeHighlightId,
            );
            // wait until the targeted message is actually in the loaded window
            // before centring on it - the fresh window may still be loading.
            if (index !== -1) {
                lastScrolledIdRef.current = activeHighlightId;
                // parked on a targeted (older) message now: make sure the
                // stay-pinned-to-bottom paths don't drag us back down if we
                // happened to be at the bottom when the jump started.
                if (isAtBottomRef.current) {
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                }
                // re-centre across measurement passes rather than once, so the
                // target doesn't drift into empty space as rows settle to their
                // real heights.
                settleToTarget(activeHighlightId);
            }
        }, [activeHighlightId, virtualItems, settleToTarget]);

        useEffect((): (() => void) | undefined => {
            if (!highlightId) return;

            // fade only the highlight glow; targetMessageId is deliberately left
            // in place so the viewport stays parked on the jumped-to message
            // instead of snapping back to the latest page. It's reset elsewhere,
            // on "Jump to latest" or a channel switch.
            const timer = setTimeout((): void => {
                setInternalHighlightId(null);
            }, 2000);

            return (): void => {
                clearTimeout(timer);
            };
        }, [highlightId]);

        return (
            <Box className="relative flex min-h-0 flex-1 flex-col">
                <Box
                    className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"
                    ref={scrollContainerRef}
                    style={{
                        overflowAnchor: 'none',
                        opacity: hasSettled ? 1 : 0,
                    }}
                    onScroll={handleScroll}
                >
                    <Box
                        className="relative w-full"
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const item = virtualItems[virtualRow.index];
                            if (!item) return null;
                            const prevItem =
                                virtualRow.index > 0
                                    ? virtualItems[virtualRow.index - 1]
                                    : undefined;
                            return (
                                <div
                                    data-index={virtualRow.index}
                                    key={virtualRow.key}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {item.type === 'loader-older' ? (
                                        <Box className="flex justify-center py-4">
                                            {isLoadingMore ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <Button
                                                    className="text-foreground-muted border-none bg-transparent text-xs shadow-none transition-colors hover:bg-bg-subtle hover:text-foreground"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={onLoadMore}
                                                >
                                                    Load older messages
                                                </Button>
                                            )}
                                        </Box>
                                    ) : null}

                                    {item.type === 'message' ? (
                                        <MessageItem
                                            disableColors={disableColors}
                                            disableCustomFonts={
                                                disableCustomFonts
                                            }
                                            disableGlow={disableGlow}
                                            disableGlowAndColors={
                                                disableGlowAndColors
                                            }
                                            fullMemberMap={fullMemberMap}
                                            hasPermission={hasPermission}
                                            iconRole={item.message.iconRole}
                                            isHighlighted={
                                                highlightId === item.message.id
                                            }
                                            isOwner={isOwner}
                                            me={me}
                                            message={item.message}
                                            prevMessage={
                                                prevItem?.type === 'message'
                                                    ? prevItem.message
                                                    : undefined
                                            }
                                            role={item.message.role}
                                            roleMap={roleMap}
                                            senderMember={fullMemberMap?.get(
                                                item.message.senderId,
                                            )}
                                            senderRoles={userRolesMap?.get(
                                                item.message.senderId,
                                            )}
                                            serverDetails={serverDetails}
                                            onReplyClick={handleReplyClick}
                                            onReplyToMessage={onReplyToMessage}
                                            onResize={requestMeasure}
                                        />
                                    ) : null}

                                    {item.type === 'blocked-group' ? (
                                        <Box className="my-1 px-4 py-2">
                                            <Box
                                                className="text-foreground-muted flex cursor-pointer items-center gap-2 text-xs font-medium transition-colors hover:text-foreground"
                                                onClick={(): void => {
                                                    toggleGroup(item.id);
                                                }}
                                            >
                                                {expandedGroups.has(item.id) ? (
                                                    <ChevronDown size={14} />
                                                ) : (
                                                    <ChevronRight size={14} />
                                                )}
                                                <Text>
                                                    {item.messages.length === 1
                                                        ? `1 message from blocked user`
                                                        : `${item.messages.length} messages from blocked users`}
                                                </Text>
                                            </Box>
                                            {expandedGroups.has(item.id) ? (
                                                <Box className="mt-2 ml-1.5 border-l border-white/5 pl-2">
                                                    {item.messages.map(
                                                        (msg, mIdx) => (
                                                            <MessageItem
                                                                disableColors={
                                                                    disableColors
                                                                }
                                                                disableCustomFonts={
                                                                    disableCustomFonts
                                                                }
                                                                disableGlow={
                                                                    disableGlow
                                                                }
                                                                disableGlowAndColors={
                                                                    disableGlowAndColors
                                                                }
                                                                fullMemberMap={
                                                                    fullMemberMap
                                                                }
                                                                hasPermission={
                                                                    hasPermission
                                                                }
                                                                iconRole={
                                                                    msg.iconRole
                                                                }
                                                                isHighlighted={
                                                                    highlightId ===
                                                                    msg.id
                                                                }
                                                                isOwner={
                                                                    isOwner
                                                                }
                                                                key={msg.id}
                                                                me={me}
                                                                message={msg}
                                                                prevMessage={
                                                                    mIdx > 0
                                                                        ? item
                                                                              .messages[
                                                                              mIdx -
                                                                                  1
                                                                          ]
                                                                        : undefined
                                                                }
                                                                role={msg.role}
                                                                roleMap={
                                                                    roleMap
                                                                }
                                                                senderMember={fullMemberMap?.get(
                                                                    msg.senderId,
                                                                )}
                                                                senderRoles={userRolesMap?.get(
                                                                    msg.senderId,
                                                                )}
                                                                serverDetails={
                                                                    serverDetails
                                                                }
                                                                onReplyClick={
                                                                    handleReplyClick
                                                                }
                                                                onReplyToMessage={
                                                                    onReplyToMessage
                                                                }
                                                                onResize={
                                                                    requestMeasure
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </Box>
                                            ) : null}
                                        </Box>
                                    ) : null}

                                    {item.type === 'loader-newer' ? (
                                        <Box className="flex justify-center py-4">
                                            {isLoadingMoreNewer ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <Button
                                                    className="text-foreground-muted border-none bg-transparent text-xs shadow-none transition-colors hover:bg-bg-subtle hover:text-foreground"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={onLoadMoreNewer}
                                                >
                                                    Load newer messages
                                                </Button>
                                            )}
                                        </Box>
                                    ) : null}

                                    {item.type === 'spacer' ? (
                                        <VerticalSpacer verticalSpace={22} />
                                    ) : null}
                                </div>
                            );
                        })}
                    </Box>
                </Box>
                {hasSettled ? null : (
                    <Box className="pointer-events-none absolute inset-0 overflow-hidden">
                        <ChatSkeleton />
                    </Box>
                )}
            </Box>
        );
    },
);

MessagesList.displayName = 'MessagesList';
