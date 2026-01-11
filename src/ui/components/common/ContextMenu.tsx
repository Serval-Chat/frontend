import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

export type ContextMenuItem =
    | {
          type?: 'action';
          label: string;
          icon: LucideIcon;
          onClick: () => void;
          variant?: 'normal' | 'primary' | 'danger' | 'caution' | 'success';
      }
    | { type: 'divider' };

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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setPosition({ x: e.clientX, y: e.clientY });
        setIsOpen(true);
    };

    const closeMenu = () => setIsOpen(false);

    // Make sure we dont overflow.
    React.useLayoutEffect(() => {
        if (isOpen && menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;

            let { x, y } = position;

            // Check horizontal overflow
            if (x + menuRect.width > innerWidth) {
                x = innerWidth - menuRect.width - 8;
            }

            // Check vertical overflow
            if (y + menuRect.height > innerHeight) {
                y = innerHeight - menuRect.height - 8;
            }

            // Ensure not negative
            x = Math.max(8, x);
            y = Math.max(8, y);

            if (x !== position.x || y !== position.y) {
                setPosition({ x, y });
            }
        }
    }, [isOpen, position]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

    const getVariantStyles = (variant?: string) => {
        switch (variant) {
            case 'primary':
                return 'text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)]';
            case 'danger':
                return 'text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]';
            case 'caution':
                return 'text-[var(--color-caution)] hover:bg-[var(--color-caution-muted)]';
            case 'success':
                return 'text-[var(--color-success)] hover:bg-[var(--color-success-muted)]';
            default:
                return 'text-foreground/90 hover:bg-[var(--color-bg-subtle)]';
        }
    };

    return (
        <>
            <div
                onContextMenu={handleContextMenu}
                className={cn('inline-block', className)}
            >
                {children}
            </div>

            {isOpen &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: position.y,
                                left: position.x,
                                zIndex: 9999,
                            }}
                            className="min-w-[200px] bg-[var(--color-background)] border border-[var(--color-bg-secondary)] rounded-xl shadow-xl overflow-hidden backdrop-blur-md py-1.5"
                        >
                            {items.map((item, index) => {
                                if (item.type === 'divider') {
                                    return (
                                        <div
                                            key={index}
                                            className="h-px bg-[var(--color-bg-secondary)] my-1"
                                        />
                                    );
                                }

                                const Icon = item.icon;
                                const variantClasses = getVariantStyles(
                                    item.variant
                                );

                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            item.onClick();
                                            closeMenu();
                                        }}
                                        className={cn(
                                            'w-full flex items-center px-3 py-2 text-sm transition-colors group',
                                            variantClasses
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 transition-opacity',
                                                item.variant &&
                                                    item.variant !== 'normal' &&
                                                    'opacity-100'
                                            )}
                                        />
                                        <span className="font-medium">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
};
