import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

import {
    type Decoration,
    decorationsApi,
    getDecorationUrl,
} from '@/api/decorations';
import { useMe } from '@/api/users/users.queries';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Heading } from '@/ui/components/common/Heading';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { cn } from '@/utils/cn';

interface AvatarDecorationPickerProps {
    className?: string;
}

const EMPTY_DECORATIONS: Decoration[] = [];

export const AvatarDecorationPicker = ({
    className,
}: AvatarDecorationPickerProps) => {
    const { data: user } = useMe();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const limitedAnimations = useLimitedAnimations();

    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [search, setSearch] = useState('');
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const { data: myDecorationsResponse } = useQuery({
        queryKey: ['my-decorations'],
        queryFn: () => decorationsApi.getMyDecorations(),
        enabled: isOpen,
    });
    const decorations =
        myDecorationsResponse?.decorations ?? EMPTY_DECORATIONS;
    const filteredDecorations = useMemo(
        () =>
            decorations.filter((deco) =>
                deco.name.toLowerCase().includes(search.trim().toLowerCase()),
            ),
        [decorations, search],
    );

    const applyMutation = useMutation({
        mutationFn: decorationsApi.apply,
        onSuccess: () => {
            showToast('Decoration applied!', 'success');
            void queryClient.invalidateQueries({ queryKey: ['me'] });
            setIsOpen(false);
        },
        onError: () => {
            showToast('Failed to apply decoration.', 'error');
        },
    });

    useLayoutEffect((): (() => void) | undefined => {
        if (!isOpen) return undefined;

        const updatePosition = (): void => {
            if (!triggerRef.current || !panelRef.current) return;
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const panelRect = panelRef.current.getBoundingClientRect();
            const padding = 16;
            const offset = 12;

            let x = triggerRect.left - panelRect.width - offset;
            let y = triggerRect.top;

            if (x < padding) x = padding;
            if (y + panelRect.height > window.innerHeight - padding) {
                y = window.innerHeight - panelRect.height - padding;
            }
            if (y < padding) y = padding;

            setCoords({ x, y });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return (): void => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, filteredDecorations.length]);

    useLayoutEffect((): (() => void) | undefined => {
        if (!isOpen) return undefined;

        const handleClickOutside = (event: MouseEvent): void => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return (): void => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!user) return null;

    return (
        <div className={cn('shrink-0', className)}>
            <Heading
                className="mb-3 text-sm font-bold text-muted-foreground uppercase"
                level={4}
            >
                Decoration
            </Heading>
            <button
                className="flex w-full flex-col items-center gap-3 rounded-xl border border-border-subtle bg-bg-subtle p-4 text-center transition-colors hover:border-primary/50"
                ref={triggerRef}
                type="button"
                onClick={(): void => {
                    setIsOpen((v) => !v);
                }}
                onMouseEnter={(): void => {
                    setIsHovered(true);
                }}
                onMouseLeave={(): void => {
                    setIsHovered(false);
                }}
            >
                <div className="relative h-20 w-20 shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-secondary">
                        {user.profilePicture ? (
                            <img
                                alt=""
                                className="h-full w-full object-cover"
                                src={user.profilePicture}
                            />
                        ) : (
                            <span className="text-xl font-bold text-muted-foreground">
                                {user.username[0]?.toUpperCase()}
                            </span>
                        )}
                    </div>
                    {user.decorationId ? (
                        <PausedAnimatedImage
                            alt=""
                            className="pointer-events-none absolute inset-0 z-10 h-full w-full scale-125 object-cover"
                            paused={limitedAnimations || !isHovered}
                            src={getDecorationUrl(user.decorationId, 96)}
                        />
                    ) : (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
                            <Sparkles size={28} />
                        </div>
                    )}
                </div>
                <Text size="xs" variant="muted">
                    {user.decorationId
                        ? 'Click to change'
                        : 'Click to add a decoration'}
                </Text>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen ? (
                        <m.div
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="fixed z-[var(--z-index-popover)] flex w-80 flex-col overflow-hidden rounded-xl border border-border-subtle bg-background shadow-2xl"
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            ref={panelRef}
                            style={{ top: coords.y, left: coords.x }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            <div className="border-b border-border-subtle p-3">
                                <div className="relative">
                                    <Search
                                        className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
                                        size={14}
                                    />
                                    <input
                                        className="w-full rounded-md border border-border-subtle bg-bg-subtle py-1.5 pr-2 pl-8 text-sm focus:border-primary focus:outline-none"
                                        placeholder="Search decorations..."
                                        type="text"
                                        value={search}
                                        onChange={(e): void => {
                                            setSearch(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="custom-scrollbar max-h-80 overflow-y-auto p-3">
                                {filteredDecorations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
                                        <Text size="sm" variant="muted">
                                            {decorations.length === 0
                                                ? "You haven't uploaded any decorations yet."
                                                : 'No decorations match your search.'}
                                        </Text>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {filteredDecorations.map((deco) => {
                                            const isActive =
                                                user.decorationId === deco.id;
                                            return (
                                                <button
                                                    className={cn(
                                                        'group flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors',
                                                        isActive
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-transparent hover:border-border-subtle hover:bg-bg-subtle',
                                                    )}
                                                    disabled={
                                                        applyMutation.isPending
                                                    }
                                                    key={deco.id}
                                                    title={deco.name}
                                                    type="button"
                                                    onClick={(): void => {
                                                        if (!isActive) {
                                                            applyMutation.mutate(
                                                                deco.id,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <div className="relative h-12 w-12 shrink-0">
                                                        <div className="absolute inset-0 overflow-hidden rounded-full border border-border-subtle bg-bg-subtle" />
                                                        <div
                                                            className="pointer-events-none absolute inset-0 z-10 scale-125"
                                                            style={{
                                                                backgroundImage: `url(${getDecorationUrl(deco.id, 48)})`,
                                                                backgroundSize:
                                                                    'cover',
                                                                backgroundPosition:
                                                                    'center',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                                                        {deco.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </m.div>
                    ) : null}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
};
