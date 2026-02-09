import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface DropdownOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface DropdownWithSearchProps {
    options: DropdownOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    label?: string;
    className?: string;
    noOptionsMessage?: string;
    allowClear?: boolean;
}

export const DropdownWithSearch: React.FC<DropdownWithSearchProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    label,
    className,
    noOptionsMessage = 'No options found',
    allowClear = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = useMemo(
        () => options.find((opt) => opt.id === value),
        [options, value],
    );

    const filteredOptions = useMemo(
        () =>
            options.filter((opt) =>
                opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [options, searchQuery],
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (): void => setIsOpen(!isOpen);

    const handleSelect = (optionId: string | null): void => {
        onChange(optionId);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <Box className={cn('relative w-full', className)} ref={containerRef}>
            {label && (
                <Text
                    as="label"
                    className="block mb-2 text-xs font-bold uppercase text-[var(--color-muted-foreground)] tracking-wider"
                >
                    {label}
                </Text>
            )}

            <Button
                className={cn(
                    'flex items-center justify-between w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-lg text-sm transition-all duration-200 hover:border-[var(--color-primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 shadow-none',
                    isOpen &&
                        'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20',
                )}
                innerClassName="w-full justify-between"
                type="button"
                variant="ghost"
                onClick={handleToggle}
            >
                <div className="flex items-center gap-3 truncate">
                    {selectedOption?.icon && (
                        <div className="flex-shrink-0">
                            {selectedOption.icon}
                        </div>
                    )}
                    <span
                        className={cn(
                            'truncate',
                            !selectedOption
                                ? 'text-[var(--color-muted-foreground)]'
                                : 'text-[var(--color-foreground)]',
                        )}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {allowClear && value && (
                        <Button
                            className="p-1 hover:bg-[var(--color-bg-subtle)] rounded-full text-[var(--color-muted-foreground)] transition-colors h-6 w-6 border-none shadow-none"
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={handleClear}
                        >
                            <X size={14} />
                        </Button>
                    )}
                    <ChevronDown
                        className={cn(
                            'text-[var(--color-muted-foreground)] transition-transform duration-200',
                            isOpen && 'rotate-180',
                        )}
                        size={16}
                    />
                </div>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute z-[var(--z-index-popover)] w-full mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl overflow-hidden"
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        ref={dropdownRef}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <div className="p-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
                                    size={14}
                                />
                                <input
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border-subtle)] rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <Button
                                        className={cn(
                                            'flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-left group border-none shadow-none justify-start',
                                            option.id === value
                                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                : 'hover:bg-[var(--color-bg-subtle)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                                        )}
                                        innerClassName="w-full justify-start"
                                        size="md"
                                        variant="ghost"
                                        onClick={() => handleSelect(option.id)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {option.icon && (
                                                <div className="flex-shrink-0">
                                                    {option.icon}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">
                                                    {option.label}
                                                </span>
                                                {option.description && (
                                                    <span className="text-[10px] opacity-70 truncate">
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {option.id === value && (
                                            <Check
                                                className="flex-shrink-0 ml-2"
                                                size={14}
                                            />
                                        )}
                                    </Button>
                                ))
                            ) : (
                                <div className="p-4 text-center">
                                    <Text
                                        className="text-[var(--color-muted-foreground)]"
                                        size="xs"
                                    >
                                        {noOptionsMessage}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};
