import React, { useRef, useState } from 'react';

import { Plus, Smile, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useClickAway } from 'react-use';

import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';
import { ParsedUnicodeEmoji } from '@/ui/components/common/ParsedUnicodeEmoji';
import { Slider } from '@/ui/components/common/Slider';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { Box } from '@/ui/components/layout/Box';
import { APP_LOCALE } from '@/utils/locale';

const EmojiPicker = React.lazy(() =>
    import('@/ui/components/emoji/EmojiPicker').then((m) => ({
        default: m.EmojiPicker,
    })),
);

const MIN_POLL_DURATION_MS = 5 * 60 * 1000;
const MAX_POLL_DURATION_DAYS = 90;
const MAX_POLL_DURATION_MS = MAX_POLL_DURATION_DAYS * 24 * 60 * 60 * 1000;

interface PollOptionInput {
    id: string;
    text: string;
    emoji?: string;
    emojiType?: 'unicode' | 'custom';
    emojiId?: string;
}

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (poll: {
        title: string;
        options: {
            text: string;
            emoji?: string;
            emojiType?: 'unicode' | 'custom';
            emojiId?: string;
        }[];
        multiSelect: boolean;
        expiresAt?: string;
    }) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState<PollOptionInput[]>([
        { id: '1', text: '' },
        { id: '2', text: '' },
    ]);
    const [multiSelect, setMultiSelect] = useState(false);
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState<
        'minutes' | 'hours' | 'days'
    >('hours');
    const [expiryPreview, setExpiryPreview] = useState<string>('');

    const [activeEmojiOption, setActiveEmojiOption] = useState<string | null>(
        null,
    );
    const [pickerCoords, setPickerCoords] = useState({ top: 0, left: 0 });
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const updatePickerPosition = (id: string): void => {
        const trigger = triggerRefs.current[id];
        const picker = emojiPickerRef.current;
        if (trigger) {
            const rect = trigger.getBoundingClientRect();
            const pickerWidth = picker?.offsetWidth || 352;
            const spacing = 4;
            const margin = 16;

            setPickerCoords({
                top: rect.bottom + spacing,
                left: Math.min(
                    rect.left,
                    window.innerWidth - pickerWidth - margin,
                ),
            });
        }
    };

    React.useLayoutEffect(() => {
        if (activeEmojiOption) {
            updatePickerPosition(activeEmojiOption);

            const handleScroll = (e: Event): void => {
                if (emojiPickerRef.current?.contains(e.target as Node)) {
                    return;
                }
                setActiveEmojiOption(null);
            };

            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', () =>
                updatePickerPosition(activeEmojiOption),
            );

            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', () =>
                    updatePickerPosition(activeEmojiOption),
                );
            };
        }
    }, [activeEmojiOption]);

    const getDurationMs = React.useCallback((): number => {
        const multipliers = {
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000,
        };
        let ms = durationValue * multipliers[durationUnit];
        if (ms < MIN_POLL_DURATION_MS) ms = MIN_POLL_DURATION_MS;
        if (ms > MAX_POLL_DURATION_MS) ms = MAX_POLL_DURATION_MS;
        return ms;
    }, [durationValue, durationUnit]);

    const maxDurationValue =
        durationUnit === 'minutes'
            ? MAX_POLL_DURATION_DAYS * 24 * 60
            : durationUnit === 'hours'
              ? MAX_POLL_DURATION_DAYS * 24
              : MAX_POLL_DURATION_DAYS;

    const PRESETS = [
        { label: '5 min', val: 5, unit: 'minutes' },
        { label: '15 min', val: 15, unit: 'minutes' },
        { label: '1 hr', val: 1, unit: 'hours' },
        { label: '1 day', val: 1, unit: 'days' },
        { label: '7 days', val: 7, unit: 'days' },
        { label: '90 days', val: 90, unit: 'days' },
    ] as const;

    React.useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setOptions([
                { id: '1', text: '' },
                { id: '2', text: '' },
            ]);
            setMultiSelect(false);
            setDurationValue(1);
            setDurationUnit('hours');
            setActiveEmojiOption(null);
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen) {
            setExpiryPreview(
                new Date(Date.now() + getDurationMs()).toLocaleString(
                    APP_LOCALE,
                    {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    },
                ),
            );
        }
    }, [isOpen, durationValue, durationUnit, getDurationMs]);

    const { customCategories } = useCustomEmojis({
        enabled: activeEmojiOption !== null,
    });

    useClickAway(emojiPickerRef, () => {
        setActiveEmojiOption(null);
    });

    const handleAddOption = (): void => {
        if (options.length < 10) {
            setOptions([...options, { id: Date.now().toString(), text: '' }]);
        }
    };

    const handleRemoveOption = (id: string): void => {
        if (options.length > 2) {
            setOptions(options.filter((opt) => opt.id !== id));
        }
    };

    const handleOptionChange = (id: string, text: string): void => {
        setOptions(
            options.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
        );
    };

    const handleEmojiSelect = (
        id: string,
        emoji: string,
        type: 'unicode' | 'custom' = 'unicode',
        emojiId?: string,
    ): void => {
        setOptions(
            options.map((opt) =>
                opt.id === id
                    ? { ...opt, emoji, emojiType: type, emojiId }
                    : opt,
            ),
        );
    };

    const handleSubmit = (): void => {
        const validOptions = options.filter(
            (opt) => opt.text.trim().length > 0,
        );
        if (title.trim().length === 0 || validOptions.length < 2) {
            return;
        }

        const expiresAt = new Date(Date.now() + getDurationMs()).toISOString();

        onSubmit({
            title: title.trim(),
            options: validOptions.map((opt) => ({
                text: opt.text.trim(),
                emoji: opt.emoji,
                emojiType: opt.emojiType,
                emojiId: opt.emojiId,
            })),
            multiSelect,
            expiresAt,
        });
        onClose();
    };

    const isValid =
        title.trim().length > 0 &&
        options.filter((opt) => opt.text.trim().length > 0).length >= 2;

    return (
        <Modal
            className="w-full max-w-md"
            isOpen={isOpen}
            title="Create Poll"
            onClose={onClose}
        >
            <Box className="flex flex-col gap-4">
                <Box>
                    <Text className="mb-2 text-sm font-semibold text-foreground">
                        Poll Question
                    </Text>
                    <Input
                        maxLength={192}
                        placeholder="Ask a question..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text className="mb-2 text-sm font-semibold text-foreground">
                        Options
                    </Text>
                    <Box className="relative flex flex-col gap-2">
                        {options.map((opt, index) => (
                            <Box
                                className="relative flex items-center gap-2"
                                key={opt.id}
                            >
                                <Button
                                    className="h-10 w-10 shrink-0 p-0 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    ref={(el) => {
                                        triggerRefs.current[opt.id] = el;
                                    }}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                        setActiveEmojiOption(
                                            activeEmojiOption === opt.id
                                                ? null
                                                : opt.id,
                                        )
                                    }
                                >
                                    {opt.emoji ? (
                                        <Box className="flex items-center justify-center">
                                            {opt.emojiType === 'custom' &&
                                            opt.emojiId ? (
                                                <ParsedEmoji
                                                    className="h-6 w-6"
                                                    emojiId={opt.emojiId}
                                                />
                                            ) : (
                                                <ParsedUnicodeEmoji
                                                    className="text-xl"
                                                    content={opt.emoji}
                                                />
                                            )}
                                        </Box>
                                    ) : (
                                        <Smile size={18} />
                                    )}
                                </Button>
                                <Input
                                    maxLength={192}
                                    placeholder={`Option ${index + 1}`}
                                    value={opt.text}
                                    onChange={(e) =>
                                        handleOptionChange(
                                            opt.id,
                                            e.target.value,
                                        )
                                    }
                                />
                                {options.length > 2 && (
                                    <Button
                                        className="h-10 w-10 shrink-0 p-0 text-muted-foreground hover:bg-danger/20 hover:text-danger"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            handleRemoveOption(opt.id)
                                        }
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                )}
                            </Box>
                        ))}

                        {activeEmojiOption &&
                            createPortal(
                                <Box
                                    className="fixed z-[10000]"
                                    ref={emojiPickerRef}
                                    style={{
                                        top: pickerCoords.top,
                                        left: pickerCoords.left,
                                    }}
                                >
                                    <React.Suspense
                                        fallback={
                                            <div className="h-64 w-64 rounded-lg bg-bg-secondary" />
                                        }
                                    >
                                        <EmojiPicker
                                            customCategories={customCategories}
                                            onCustomEmojiSelect={(emoji) => {
                                                handleEmojiSelect(
                                                    activeEmojiOption,
                                                    emoji.name,
                                                    'custom',
                                                    emoji.id,
                                                );
                                                setActiveEmojiOption(null);
                                            }}
                                            onEmojiSelect={(emoji) => {
                                                handleEmojiSelect(
                                                    activeEmojiOption,
                                                    emoji,
                                                    'unicode',
                                                );
                                                setActiveEmojiOption(null);
                                            }}
                                        />
                                    </React.Suspense>
                                </Box>,
                                document.body,
                            )}

                        {options.length < 10 && (
                            <Button
                                className="bg-bg-tertiary mt-2 w-full justify-start text-muted-foreground hover:bg-bg-subtle hover:text-foreground"
                                variant="ghost"
                                onClick={handleAddOption}
                            >
                                <Plus className="mr-2" size={18} />
                                Add Option
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box className="flex items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                        Allow multiple answers
                    </Text>
                    <Toggle
                        checked={multiSelect}
                        onCheckedChange={setMultiSelect}
                    />
                </Box>

                <Box className="flex flex-col gap-2">
                    <Text className="text-sm font-semibold text-foreground">
                        Poll Duration
                    </Text>
                    <Box className="mb-2 flex flex-wrap gap-2">
                        {PRESETS.map((p) => (
                            <Button
                                className={
                                    durationValue === p.val &&
                                    durationUnit === p.unit
                                        ? ''
                                        : 'bg-white/5'
                                }
                                key={p.label}
                                size="sm"
                                variant={
                                    durationValue === p.val &&
                                    durationUnit === p.unit
                                        ? 'primary'
                                        : 'ghost'
                                }
                                onClick={() => {
                                    setDurationValue(p.val);
                                    setDurationUnit(p.unit);
                                }}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </Box>
                    <Box className="flex items-center gap-2">
                        <Input
                            className="w-24"
                            max={maxDurationValue}
                            min={1}
                            type="number"
                            value={durationValue}
                            onChange={(e) =>
                                setDurationValue(Number(e.target.value))
                            }
                        />
                        <select
                            className="bg-bg-tertiary h-10 cursor-pointer rounded-md border border-border-subtle px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/30 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            value={durationUnit}
                            onChange={(e) =>
                                setDurationUnit(
                                    e.target.value as
                                        | 'minutes'
                                        | 'hours'
                                        | 'days',
                                )
                            }
                        >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                        </select>
                    </Box>
                    <Box className="mt-2">
                        <Slider
                            max={maxDurationValue}
                            min={durationUnit === 'minutes' ? 5 : 1}
                            value={durationValue}
                            onValueChange={setDurationValue}
                        />
                    </Box>
                    <Text className="mt-0.5 text-[10px] text-muted-foreground">
                        Poll closes:{' '}
                        <span className="font-medium text-foreground/70">
                            {expiryPreview}
                        </span>
                    </Text>
                </Box>

                <Box className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!isValid}
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        Create Poll
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
