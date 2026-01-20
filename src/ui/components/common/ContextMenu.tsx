import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

import { useSmartPosition } from '@/hooks/useSmartPosition';
import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
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
                            className="min-w-[200px] bg-[var(--color-background)] border border-[var(--color-bg-secondary)] rounded-xl shadow-xl overflow-hidden backdrop-blur-md py-1.5"
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            ref={menuRef}
                            style={{
                                position: 'fixed',
                                top: position.y,
                                left: position.x,
                                zIndex: 'var(--z-top)',
                            }}
                            transition={{ duration: 0.1, ease: 'easeOut' }}
                        >
                            {items.map((item, index) => {
                                if (item.type === 'divider') {
                                    return (
                                        <Box
                                            className="h-px bg-[var(--color-bg-secondary)] my-1"
                                            key={`divider-${index}`} // eslint-disable-line react/no-array-index-key
                                        />
                                    );
                                }

                                const Icon = item.icon;
                                const variant =
                                    item.variant === 'normal'
                                        ? 'ghost'
                                        : item.variant || 'ghost';

                                return (
                                    <Button
                                        className="w-full justify-start px-3 py-2 text-sm transition-colors group h-auto font-normal rounded-none"
                                        key={item.label}
                                        variant={variant}
                                        onClick={() => {
                                            item.onClick();
                                            closeMenu();
                                        }}
                                    >
                                        <Icon
                                            className={cn(
                                                'w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 transition-opacity',
                                                item.variant &&
                                                    item.variant !== 'normal' &&
                                                    'opacity-100'
                                            )}
                                        />
                                        <Text as="span" className="font-medium">
                                            {item.label}
                                        </Text>
                                    </Button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
};
