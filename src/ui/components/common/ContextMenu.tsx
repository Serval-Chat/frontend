import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

export type ContextMenuItem =
    | {
          type?: 'action';
          label: string;
          icon: LucideIcon;
          onClick: () => void;
          variant?:
              | 'normal'
              | 'primary'
              | 'danger'
              | 'caution'
              | 'success'
              | 'ghost';
      }
    | { type: 'divider' }
    | { type: 'label'; label: string };

interface ContextMenuProps {
    items: ContextMenuItem[];
    children: React.ReactNode;
    className?: string;
}

/**
 * @description A context menu that appears on right-click.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
    items,
    children,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent): void => {
        e.preventDefault();
        setClickPosition({ x: e.clientX, y: e.clientY });
        setIsOpen(true);
    };

    const closeMenu = (): void => setIsOpen(false);

    const position = useSmartPosition({
        isOpen,
        elementRef: menuRef,
        position: clickPosition,
        padding: 8,
        offset: 0,
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                closeMenu();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <Box
                className={cn('inline-block', className)}
                onContextMenu={handleContextMenu}
            >
                {children}
            </Box>

            {isOpen &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="min-w-[220px] bg-[var(--color-background)] border border-[var(--color-border-subtle)] rounded-lg shadow-lg overflow-hidden backdrop-blur-md py-2"
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            ref={menuRef}
                            style={{
                                position: 'fixed',
                                top: position.y,
                                left: position.x,
                                zIndex: 'var(--z-top)',
                                boxShadow:
                                    '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 190, 0, 0.1)',
                            }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                        >
                            {items.map((item, index) => {
                                if (item.type === 'divider') {
                                    return (
                                        <Box
                                            className="h-px bg-[var(--color-divider)] my-1.5"
                                            key={`divider-${index}`} // eslint-disable-line react/no-array-index-key
                                        />
                                    );
                                }

                                if (item.type === 'label') {
                                    return (
                                        <div
                                            className="px-3 py-1.5 text-[10px] font-bold text-[var(--color-foreground-muted)] uppercase tracking-wider select-none"
                                            key={`label-${index}-${item.label}`} // eslint-disable-line react/no-array-index-key
                                        >
                                            {item.label}
                                        </div>
                                    );
                                }

                                const Icon = item.icon;

                                // Determine text color based on variant
                                const getTextColorClass = (): string => {
                                    switch (item.variant) {
                                        case 'danger':
                                            return 'text-[var(--color-danger)] hover:brightness-110';
                                        case 'caution':
                                            return 'text-[var(--color-caution)] hover:brightness-110';
                                        case 'success':
                                            return 'text-[var(--color-success)] hover:brightness-110';
                                        case 'primary':
                                            return 'text-[var(--color-primary)] hover:brightness-110';
                                        default:
                                            return 'text-[var(--color-foreground)] hover:brightness-110';
                                    }
                                };

                                return (
                                    <div
                                        className={cn(
                                            'w-full flex items-center px-3 py-2.5 text-sm transition-all duration-150 cursor-pointer select-none',
                                            getTextColorClass(),
                                        )}
                                        key={item.label}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            item.onClick();
                                            closeMenu();
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                e.preventDefault();
                                                item.onClick();
                                                closeMenu();
                                            }
                                        }}
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        <span className="font-medium">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
};
