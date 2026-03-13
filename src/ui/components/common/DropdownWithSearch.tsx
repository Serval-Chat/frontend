import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

import { Input } from './Input';

interface DropdownOption {
    id: string;
    label: string;
    displayLabel?: React.ReactNode;
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
                    className="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >
                    {label}
                </Text>
            )}

            <Button
                className={cn(
                    'flex w-full items-center justify-between rounded-lg border border-border-subtle bg-bg-secondary px-4 py-2 text-sm shadow-none transition-all duration-200 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
                    isOpen && 'border-primary ring-2 ring-primary/20',
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
                                ? 'text-muted-foreground'
                                : 'text-foreground',
                        )}
                    >
                        {selectedOption
                            ? selectedOption.displayLabel ||
                              selectedOption.label
                            : placeholder}
                    </span>
                </div>

                <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                    {allowClear && value && (
                        <Button
                            className="h-6 w-6 rounded-full border-none p-1 text-muted-foreground shadow-none transition-colors hover:bg-bg-subtle"
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
                            'text-muted-foreground transition-transform duration-200',
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
                        className="absolute z-[var(--z-index-popover)] mt-2 w-full overflow-hidden rounded-xl border border-border-subtle bg-background shadow-2xl backdrop-blur-md"
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        ref={dropdownRef}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <div className="border-b border-border-subtle bg-background/50 p-2 backdrop-blur-sm">
                            <div className="relative">
                                <Search
                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                    size={14}
                                />
                                <Input
                                    className="pl-9"
                                    placeholder={searchPlaceholder}
                                    size="sm"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <Button
                                        className={cn(
                                            'group flex w-full items-center justify-between rounded-md border-none px-3 py-2 text-left shadow-none transition-colors',
                                            option.id === value
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
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
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium">
                                                    {option.displayLabel ||
                                                        option.label}
                                                </span>
                                                {option.description && (
                                                    <span className="truncate text-[10px] opacity-70">
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {option.id === value && (
                                            <Check
                                                className="ml-2 flex-shrink-0"
                                                size={14}
                                            />
                                        )}
                                    </Button>
                                ))
                            ) : (
                                <div className="p-4 text-center">
                                    <Text
                                        className="text-muted-foreground"
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
