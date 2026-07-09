import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

export type ContextMenuItem =
    | {
          id?: string;
          type?: 'action';
          label: React.ReactNode;
          icon?: LucideIcon;
          rightIcon?: LucideIcon;
          onClick: () => void;
          variant?:
              | 'normal'
              | 'primary'
              | 'danger'
              | 'caution'
              | 'success'
              | 'ghost';
          preventClose?: boolean;
          indent?: boolean;
      }
    | { id?: string; type: 'divider' }
    | { id?: string; type: 'label'; label: string }
    | {
          id?: string;
          type: 'submenu';
          label: string;
          icon?: LucideIcon;
          items: ContextMenuItem[];
      }
    | {
          id?: string;
          type: 'custom';
          content: React.ReactNode;
      };

interface ContextMenuProps {
    items: ContextMenuItem[];
    children: React.ReactNode;
    className?: string;
    onOpenChange?: (open: boolean) => void;
}

const CONTEXT_MENU_OPEN_EVENT = 'serchat:context-menu-open';
let nextContextMenuId = 0;

/**
 * @description A context menu that appears on right-click.
 */
const filterItems = (items: ContextMenuItem[]): ContextMenuItem[] => {
    const result: ContextMenuItem[] = [];
    for (const item of items) {
        if (item.type !== 'divider') {
            result.push(item);
        } else if (result.at(-1) && result.at(-1)?.type !== 'divider') {
            result.push(item);
        }
    }
    if (result.at(-1)?.type === 'divider') {
        result.pop();
    }
    return result;
};

export const ContextMenu = ({
    items,
    children,
    className,
    onOpenChange,
}: ContextMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const menuIdRef = useRef(nextContextMenuId++);

    const onOpenChangeRef = useRef(onOpenChange);
    useLayoutEffect(() => {
        onOpenChangeRef.current = onOpenChange;
    });

    const closeMenu = React.useCallback((): void => {
        setIsOpen((wasOpen): boolean => {
            if (wasOpen) {
                onOpenChangeRef.current?.(false);
            }
            return false;
        });
    }, []);

    const handleContextMenu = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        if (items.length === 0) return;

        globalThis.dispatchEvent(
            new CustomEvent<number>(CONTEXT_MENU_OPEN_EVENT, {
                detail: menuIdRef.current,
            }),
        );
        setClickPosition({ x: e.clientX, y: e.clientY });
        setIsOpen(true);
        onOpenChange?.(true);
    };

    const position = useSmartPosition({
        isOpen,
        elementRef: menuRef,
        position: clickPosition,
        padding: 8,
        offset: 0,
    });

    useEffect((): (() => void) => {
        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;

            // Check if click is inside the main menu
            if (menuRef.current && menuRef.current.contains(target)) {
                return;
            }

            // Check if click is inside any submenu portal
            if (
                target instanceof Element &&
                target.closest('.context-menu-portal')
            ) {
                return;
            }

            closeMenu();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return (): void => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
        // closeMenu is a useCallback with an empty dep array (permanently
        // stable identity), so it can never actually cause a re-subscribe here.
        // react-doctor-disable-next-line react-doctor/prefer-use-effect-event
    }, [isOpen, closeMenu]);

    useEffect((): (() => void) => {
        const handleAnotherMenuOpen = (event: Event): void => {
            const openEvent = event as CustomEvent<number>;
            if (openEvent.detail !== menuIdRef.current) {
                closeMenu();
            }
        };

        globalThis.addEventListener(
            CONTEXT_MENU_OPEN_EVENT,
            handleAnotherMenuOpen,
        );

        return (): void => {
            globalThis.removeEventListener(
                CONTEXT_MENU_OPEN_EVENT,
                handleAnotherMenuOpen,
            );
        };
    }, [closeMenu]);

    const filteredItems = filterItems(items);

    return (
        <>
            <Box
                className={cn('block min-w-0', className)}
                onContextMenu={handleContextMenu}
            >
                {children}
            </Box>

            {isOpen
                ? createPortal(
                      <AnimatePresence>
                          <m.div
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="context-menu-portal min-w-[220px] overflow-hidden rounded-lg border border-border-subtle bg-background py-2 shadow-lg backdrop-blur-md"
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              ref={menuRef}
                              style={{
                                  position: 'fixed',
                                  top: position.y,
                                  left: position.x,
                                  zIndex: 'var(--z-index-top)',
                                  boxShadow:
                                      '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 190, 0, 0.1)',
                              }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                          >
                              {filteredItems.map((item, index) => (
                                  <ContextMenuItemRenderer
                                      closeMenu={closeMenu}
                                      item={item}
                                      key={
                                          item.id ??
                                          (item.type === 'divider'
                                              ? `divider-${index}`
                                              : item.type === 'custom'
                                                ? `custom-${index}`
                                                : typeof item.label === 'string'
                                                  ? `item-${item.label}`
                                                  : `index-${index}`)
                                      }
                                  />
                              ))}
                          </m.div>
                      </AnimatePresence>,
                      document.body,
                  )
                : null}
        </>
    );
};

interface ContextMenuItemProps {
    item: ContextMenuItem;
    closeMenu: () => void;
}

const ContextMenuItemRenderer = ({ item, closeMenu }: ContextMenuItemProps) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = (): void => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsSubmenuOpen(true);
    };

    const handleMouseLeave = (): void => {
        closeTimerRef.current = setTimeout((): void => {
            setIsSubmenuOpen(false);
        }, 300); // 300ms grace period
    };

    const handleSubMenuMouseEnter = (): void => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    useEffect(
        (): (() => void) => (): void => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        },
        [],
    );

    if (item.type === 'divider') {
        return <Box className="my-1.5 h-px bg-divider" />;
    }

    if (item.type === 'label') {
        return (
            <div className="text-foreground-muted px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase select-none">
                {item.label}
            </div>
        );
    }

    if (item.type === 'custom') {
        return <div className="px-3 py-1.5">{item.content}</div>;
    }

    if (item.type === 'submenu') {
        return (
            <div
                className="relative w-full"
                ref={itemRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    aria-expanded={isSubmenuOpen}
                    aria-haspopup="true"
                    className={cn(
                        'flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-sm text-foreground transition-all duration-150 select-none hover:bg-bg-subtle',
                        isSubmenuOpen && 'bg-bg-subtle',
                    )}
                    type="button"
                    onClick={(e): void => {
                        e.stopPropagation();
                        setIsSubmenuOpen((prev): boolean => !prev);
                    }}
                    onKeyDown={(e): void => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsSubmenuOpen((prev): boolean => !prev);
                        }
                    }}
                >
                    <div className="flex items-center">
                        {item.icon ? (
                            <item.icon className="mr-3 h-4 w-4" />
                        ) : null}
                        <span className="font-medium">{item.label}</span>
                    </div>
                    <svg
                        className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform duration-150',
                            isSubmenuOpen ? 'rotate-90' : '',
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M9 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                        />
                    </svg>
                </button>

                {/* Submenu Portal */}
                <AnimatePresence>
                    {isSubmenuOpen ? (
                        <SubMenu
                            closeAll={closeMenu}
                            isOpen={isSubmenuOpen}
                            items={item.items}
                            parentRef={itemRef}
                            onMouseEnter={handleSubMenuMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                    ) : null}
                </AnimatePresence>
            </div>
        );
    }

    const Icon = item.icon;

    // Determine text color based on variant
    const getTextColorClass = (): string => {
        switch (item.variant) {
            case 'danger': {
                return 'text-danger hover:brightness-110';
            }
            case 'caution': {
                return 'text-caution hover:brightness-110';
            }
            case 'success': {
                return 'text-success hover:brightness-110';
            }
            case 'primary': {
                return 'text-primary hover:brightness-110';
            }
            case 'ghost': {
                return 'opacity-50 cursor-not-allowed';
            }
            case 'normal':
            case undefined:
            default: {
                return 'text-foreground hover:brightness-110';
            }
        }
    };

    return (
        <button
            className={cn(
                'flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-sm transition-all duration-150 select-none hover:bg-bg-subtle',
                getTextColorClass(),
            )}
            tabIndex={item.variant === 'ghost' ? -1 : 0}
            type="button"
            onClick={(e): void => {
                if (item.variant === 'ghost') {
                    e.stopPropagation();
                    return;
                }
                item.onClick();
                if (!item.preventClose) {
                    closeMenu();
                }
            }}
            onKeyDown={(e): void => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (item.variant === 'ghost') return;
                    item.onClick();
                    if (!item.preventClose) {
                        closeMenu();
                    }
                }
            }}
        >
            {Icon ? <Icon className="mr-3 h-4 w-4" /> : null}
            {!Icon && item.indent !== false ? (
                <div className="mr-3 h-4 w-4" />
            ) : null}
            <span className="flex-1 font-medium">{item.label}</span>
            {item.rightIcon ? (
                <item.rightIcon className="ml-2 h-4 w-4" />
            ) : null}
        </button>
    );
};

interface SubMenuProps {
    items: ContextMenuItem[];
    parentRef: React.RefObject<HTMLDivElement | null>;
    isOpen: boolean;
    closeAll: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const SubMenu = ({
    items,
    parentRef,
    isOpen,
    closeAll,
    onMouseEnter,
    onMouseLeave,
}: SubMenuProps): React.ReactPortal | null => {
    const menuRef = useRef<HTMLDivElement>(null);
    const position = useSmartPosition({
        isOpen,
        elementRef: menuRef,
        triggerRef: parentRef,
        offset: 0,
        padding: 8,
    });

    if (!isOpen) return null;

    const filteredItems = filterItems(items);

    return createPortal(
        <m.div
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="context-menu-portal fixed z-[var(--z-index-top)] min-w-[180px] overflow-hidden rounded-lg border border-border-subtle bg-background py-2 shadow-lg backdrop-blur-md"
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={menuRef}
            style={{
                top: position.y,
                left: position.x,
                boxShadow:
                    '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 190, 0, 0.1)',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {filteredItems.map((item: ContextMenuItem, index: number) => (
                <ContextMenuItemRenderer
                    closeMenu={closeAll}
                    item={item}
                    key={
                        item.id ??
                        (item.type === 'divider'
                            ? `sub-divider-${index}`
                            : item.type === 'custom'
                              ? `sub-custom-${index}`
                              : typeof item.label === 'string'
                                ? `sub-item-${item.label}`
                                : `sub-index-${index}`)
                    }
                />
            ))}
        </m.div>,
        document.body,
    );
};
