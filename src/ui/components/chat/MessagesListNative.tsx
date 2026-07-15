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

import { ChevronDown, ChevronRight } from 'lucide-react';

import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessageItem } from '@/ui/components/chat/MessageItem';
import type {
    MessagesListHandle,
    MessagesListProps,
} from '@/ui/components/chat/MessagesList';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { VerticalSpacer } from '@/ui/components/layout/VerticalSpacer';
import { jumpDebug } from '@/utils/jumpDebug';

import { ChatSkeleton } from './ChatSkeleton';

/**
 * Non-virtualized message list, a prototype alternative to {@link MessagesList}.
 */
export const MessagesListNative = React.memo(
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

        const scrollRef = useRef<HTMLDivElement>(null);
        const contentRef = useRef<HTMLDivElement>(null);

        const [isAtBottom, setIsAtBottom] = useState(true);
        const isAtBottomRef = useRef(true);
        const onAtBottomChangeRef = useRef(onAtBottomChange);
        useLayoutEffect((): void => {
            onAtBottomChangeRef.current = onAtBottomChange;
        });
        useEffect((): void => {
            onAtBottomChangeRef.current?.(isAtBottom);
        }, [isAtBottom]);

        const activeHighlightIdRef = useRef(activeHighlightId);
        useLayoutEffect((): void => {
            activeHighlightIdRef.current = activeHighlightId;
        });

        // suppresses the history-load trigger during our own programmatic
        // scrolls (prepend compensation / jump centring).
        const programmaticScrollRef = useRef(false);
        const loadMoreCooldownRef = useRef(false);

        // reveal gate: the list is hidden behind a skeleton until the initial
        // anchor (or a jump) has settled, so no scroll-through is ever seen.
        const [hasSettled, setHasSettled] = useState(false);
        const hasSettledRef = useRef(false);
        const reveal = useCallback((): void => {
            if (hasSettledRef.current) return;
            hasSettledRef.current = true;
            setHasSettled(true);
        }, []);

        const [highlightId, setHighlightId] = useState<string | null>(null);
        const [, startHighlightTransition] = useTransition();
        useEffect((): void => {
            startHighlightTransition((): void => {
                setHighlightId(activeHighlightId ?? null);
            });
        }, [activeHighlightId]);

        const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
            new Set(),
        );
        const [, startGroupTransition] = useTransition();
        const toggleGroup = useCallback((groupId: string): void => {
            startGroupTransition((): void => {
                setExpandedGroups((prev): Set<string> => {
                    const next = new Set(prev);
                    if (next.has(groupId)) next.delete(groupId);
                    else next.add(groupId);
                    return next;
                });
            });
        }, []);

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

        type RenderItem =
            | { type: 'message'; message: ProcessedChatMessage }
            | {
                  type: 'blocked-group';
                  messages: ProcessedChatMessage[];
                  id: string;
              }
            | { type: 'loader-older' }
            | { type: 'loader-newer' }
            | { type: 'spacer' };

        const renderItems = useMemo((): RenderItem[] => {
            const items: RenderItem[] = [];
            if (hasMore) items.push({ type: 'loader-older' });

            let group: ProcessedChatMessage[] = [];
            const flush = (): void => {
                if (group.length === 0) return;
                items.push({
                    type: 'blocked-group',
                    messages: [...group],
                    id: `blocked-${group[0]!.id}`,
                });
                group = [];
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
                    group.push(msg);
                } else {
                    flush();
                    items.push({ type: 'message', message: msg });
                }
            }
            flush();

            if (hasMoreNewer) items.push({ type: 'loader-newer' });
            items.push({ type: 'spacer' });
            return items;
        }, [messages, blocks, hasMore, hasMoreNewer]);

        const firstMessageId = useMemo((): string | null => {
            const m = renderItems.find(
                (i): boolean => i.type === 'message',
            ) as { message: { id: string } } | undefined;
            return m?.message.id ?? null;
        }, [renderItems]);

        const hasContent = useMemo(
            (): boolean =>
                renderItems.some(
                    (i): boolean =>
                        i.type === 'message' || i.type === 'blocked-group',
                ),
            [renderItems],
        );

        const scrollToBottomNow = useCallback((): void => {
            const c = scrollRef.current;
            if (!c) return;
            c.scrollTop = c.scrollHeight;
        }, []);

        const centerTarget = useCallback((targetId: string): boolean => {
            const c = scrollRef.current;
            if (!c) return false;
            const el = c.querySelector<HTMLElement>(
                `[data-message-id="${CSS.escape(targetId)}"]`,
            );
            if (!el) return false;
            const cRect = c.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const delta =
                elRect.top -
                cRect.top -
                (c.clientHeight - elRect.height) / 2;
            c.scrollTop = Math.max(0, c.scrollTop + delta);
            return true;
        }, []);

        const handleScroll = useCallback((): void => {
            const c = scrollRef.current;
            if (!c) return;
            const { scrollTop, scrollHeight, clientHeight } = c;
            const nextAtBottom = scrollHeight - scrollTop - clientHeight < 5;
            if (isAtBottomRef.current !== nextAtBottom) {
                isAtBottomRef.current = nextAtBottom;
                setIsAtBottom(nextAtBottom);
            }
            if (programmaticScrollRef.current) return;
            if (scrollTop > 500) loadMoreCooldownRef.current = false;
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

        const jumpSettlingRef = useRef(false);
        const centeredTargetRef = useRef<string | null>(null);
        const settleRafRef = useRef<number | null>(null);
        const lastSettleResizeRef = useRef(0);

        const endSettle = useCallback((): void => {
            jumpSettlingRef.current = false;
            if (settleRafRef.current !== null) {
                cancelAnimationFrame(settleRafRef.current);
                settleRafRef.current = null;
            }
            programmaticScrollRef.current = false;
            // parked on an older message: not at bottom.
            isAtBottomRef.current = false;
            setIsAtBottom(false);
            reveal();
        }, [reveal]);

        const settleToTarget = useCallback(
            (targetId: string): void => {
                jumpDebug('native settle START', { targetId });
                centeredTargetRef.current = targetId;
                jumpSettlingRef.current = true;
                programmaticScrollRef.current = true;
                centerTarget(targetId);
                lastSettleResizeRef.current = performance.now();
                const start = performance.now();
                const tick = (): void => {
                    const now = performance.now();
                    // settled once the content has stopped resizing (embeds
                    // finished loading) for a beat, or a hard cap.
                    if (
                        now - lastSettleResizeRef.current > 120 ||
                        now - start > 1200
                    ) {
                        centerTarget(targetId);
                        jumpDebug('native settle STOP', {
                            elapsed: Math.round(now - start),
                            scrollTop: scrollRef.current?.scrollTop,
                        });
                        endSettle();
                        return;
                    }
                    settleRafRef.current = requestAnimationFrame(tick);
                };
                settleRafRef.current = requestAnimationFrame(tick);
            },
            [centerTarget, endSettle],
        );

        useEffect(
            (): (() => void) => (): void => {
                if (settleRafRef.current !== null) {
                    cancelAnimationFrame(settleRafRef.current);
                }
            },
            [],
        );

        useEffect((): (() => void) | undefined => {
            const content = contentRef.current;
            if (!content || typeof ResizeObserver === 'undefined') return;
            const ro = new ResizeObserver((): void => {
                if (jumpSettlingRef.current) {
                    const id = centeredTargetRef.current;
                    if (id) {
                        programmaticScrollRef.current = true;
                        centerTarget(id);
                        lastSettleResizeRef.current = performance.now();
                    }
                    return;
                }
                if (
                    isAtBottomRef.current &&
                    !activeHighlightIdRef.current
                ) {
                    programmaticScrollRef.current = true;
                    scrollToBottomNow();
                    requestAnimationFrame((): void => {
                        programmaticScrollRef.current = false;
                    });
                }
            });
            ro.observe(content);
            return (): void => {
                ro.disconnect();
            };
        }, [centerTarget, scrollToBottomNow]);

        const didInitRef = useRef(false);
        const prevFirstIdRef = useRef<string | null>(null);
        const prevActiveHighlightRef = useRef<string | null | undefined>(
            activeHighlightId,
        );
        const lastScrollHeightRef = useRef(0);

        useLayoutEffect((): void => {
            const c = scrollRef.current;
            if (!c || isLoading || renderItems.length === 0) return;

            const newSH = c.scrollHeight;
            const prevActive = prevActiveHighlightRef.current;
            const leftHighlight = !!prevActive && !activeHighlightId;
            prevActiveHighlightRef.current = activeHighlightId;
            const jumpInProgress =
                !!activeHighlightId &&
                centeredTargetRef.current !== activeHighlightId;

            // first paint for this conversation.
            if (!didInitRef.current && hasContent) {
                didInitRef.current = true;
                prevFirstIdRef.current = firstMessageId;
                lastScrollHeightRef.current = newSH;
                if (activeHighlightId) {
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                } else {
                    scrollToBottomNow();
                    lastScrollHeightRef.current = c.scrollHeight;
                }
                return;
            }

            const isPrepending =
                prevFirstIdRef.current !== null &&
                firstMessageId !== null &&
                firstMessageId !== prevFirstIdRef.current &&
                !leftHighlight &&
                !jumpInProgress;
            prevFirstIdRef.current = firstMessageId;

            // jump in progress: hold; the jump effect centres the target.
            if (jumpInProgress) {
                if (isAtBottomRef.current) {
                    isAtBottomRef.current = false;
                    setIsAtBottom(false);
                }
                lastScrollHeightRef.current = newSH;
                return;
            }

            // older history prepended: hold the viewport by the exact delta.
            if (isPrepending && lastScrollHeightRef.current !== 0) {
                const diff = newSH - lastScrollHeightRef.current;
                if (diff > 0) {
                    programmaticScrollRef.current = true;
                    c.scrollTop += diff;
                    requestAnimationFrame((): void => {
                        programmaticScrollRef.current = false;
                    });
                }
                lastScrollHeightRef.current = newSH;
                return;
            }

            // returned to latest (jump-to-latest): anchor to bottom.
            if (leftHighlight) {
                scrollToBottomNow();
                lastScrollHeightRef.current = c.scrollHeight;
                return;
            }

            // following the newest message (latest view only).
            if (isAtBottomRef.current && !activeHighlightId) {
                scrollToBottomNow();
                lastScrollHeightRef.current = c.scrollHeight;
                return;
            }

            lastScrollHeightRef.current = newSH;
        }, [
            renderItems,
            isLoading,
            activeHighlightId,
            hasContent,
            firstMessageId,
            scrollToBottomNow,
        ]);

        useEffect((): void => {
            if (!activeHighlightId) {
                centeredTargetRef.current = null;
                return;
            }
            if (centeredTargetRef.current === activeHighlightId) return;
            const present = messages.some(
                (m): boolean => m.id === activeHighlightId,
            );
            if (present) settleToTarget(activeHighlightId);
        }, [activeHighlightId, messages, settleToTarget]);

        const revealFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(
            null,
        );
        useEffect((): void => {
            if (hasSettledRef.current || isLoading) return;
            if (activeHighlightId) {
                // settleToTarget reveals once centred; failsafe if the target
                // never shows up in the window.
                if (revealFailsafeRef.current === null) {
                    revealFailsafeRef.current = setTimeout((): void => {
                        revealFailsafeRef.current = null;
                        jumpSettlingRef.current = false;
                        programmaticScrollRef.current = false;
                        reveal();
                    }, 1500);
                }
                return;
            }
            // latest view (or empty channel): the layout effect already anchored
            // to the bottom before paint, so reveal straight away.
            reveal();
        }, [isLoading, messages.length, activeHighlightId, reveal]);
        useEffect(
            (): (() => void) => (): void => {
                if (revealFailsafeRef.current !== null) {
                    clearTimeout(revealFailsafeRef.current);
                }
            },
            [],
        );

        // hide again the instant a new jump begins, covering the window reload.
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

        useEffect((): (() => void) | undefined => {
            if (!highlightId) return;
            const t = setTimeout((): void => {
                setHighlightId(null);
            }, 2000);
            return (): void => {
                clearTimeout(t);
            };
        }, [highlightId]);

        const onReplyClickRef = useRef(onReplyClick);
        useLayoutEffect((): void => {
            onReplyClickRef.current = onReplyClick;
        });
        const handleReplyClick = useCallback((messageId: string): void => {
            const c = scrollRef.current;
            const el = c?.querySelector<HTMLElement>(
                `[data-message-id="${CSS.escape(messageId)}"]`,
            );
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                setHighlightId(messageId);
            }
            onReplyClickRef.current?.(messageId);
        }, []);

        const scrollToBottom = useCallback((): void => {
            const c = scrollRef.current;
            if (!c) return;
            c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
            isAtBottomRef.current = true;
            setIsAtBottom(true);
        }, []);
        useImperativeHandle(
            ref,
            (): MessagesListHandle => ({ scrollToBottom }),
            [scrollToBottom],
        );

        // initial load-older kick when the window opens already near the top.
        useEffect((): void => {
            const c = scrollRef.current;
            if (!c) return;
            if (
                c.scrollTop < 200 &&
                hasMore &&
                !isLoadingMore &&
                !loadMoreCooldownRef.current
            ) {
                loadMoreCooldownRef.current = true;
                onLoadMore?.();
            }
        }, [messages, hasMore, isLoadingMore, onLoadMore]);

        const renderMessage = (
            msg: ProcessedChatMessage,
            prev: ProcessedChatMessage | undefined,
        ): React.ReactNode => (
            <MessageItem
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                fullMemberMap={fullMemberMap}
                hasPermission={hasPermission}
                iconRole={msg.iconRole}
                isHighlighted={highlightId === msg.id}
                isOwner={isOwner}
                me={me}
                message={msg}
                prevMessage={prev}
                role={msg.role}
                roleMap={roleMap}
                senderMember={fullMemberMap?.get(msg.senderId)}
                senderRoles={userRolesMap?.get(msg.senderId)}
                serverDetails={serverDetails}
                onReplyClick={handleReplyClick}
                onReplyToMessage={onReplyToMessage}
            />
        );

        return (
            <Box className="relative flex min-h-0 flex-1 flex-col">
                <Box
                    className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"
                    ref={scrollRef}
                    style={{
                        overflowAnchor: 'none',
                        opacity: hasSettled ? 1 : 0,
                    }}
                    onScroll={handleScroll}
                >
                    <Box className="relative w-full" ref={contentRef}>
                        {renderItems.map((item, index) => {
                            const prevItem =
                                index > 0 ? renderItems[index - 1] : undefined;

                            if (item.type === 'loader-older') {
                                return (
                                    <Box
                                        className="flex justify-center py-4"
                                        key="loader-older"
                                    >
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
                                );
                            }

                            if (item.type === 'message') {
                                return (
                                    <div
                                        data-message-id={item.message.id}
                                        key={item.message.id}
                                    >
                                        {renderMessage(
                                            item.message,
                                            prevItem?.type === 'message'
                                                ? prevItem.message
                                                : undefined,
                                        )}
                                    </div>
                                );
                            }

                            if (item.type === 'blocked-group') {
                                return (
                                    <Box
                                        className="my-1 px-4 py-2"
                                        key={item.id}
                                    >
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
                                                        <div
                                                            data-message-id={
                                                                msg.id
                                                            }
                                                            key={msg.id}
                                                        >
                                                            {renderMessage(
                                                                msg,
                                                                mIdx > 0
                                                                    ? item
                                                                          .messages[
                                                                          mIdx -
                                                                              1
                                                                      ]
                                                                    : undefined,
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </Box>
                                        ) : null}
                                    </Box>
                                );
                            }

                            if (item.type === 'loader-newer') {
                                return (
                                    <Box
                                        className="flex justify-center py-4"
                                        key="loader-newer"
                                    >
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
                                );
                            }

                            return (
                                <VerticalSpacer key="spacer" verticalSpace={22} />
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

MessagesListNative.displayName = 'MessagesListNative';
