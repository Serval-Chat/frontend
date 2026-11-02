import { type ReactNode, useState } from 'react';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Trash2 } from 'lucide-react';

import type { AdminReportReasonOption } from '@/api/reports/reports.api';
import {
    useAdminReportOptions,
    useUpdateAdminReportOptions,
} from '@/hooks/admin/useAdminReports';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { IconButton } from '@/ui/components/common/IconButton';
import { Text } from '@/ui/components/common/Text';
import { ThemeSwitcher } from '@/ui/components/settings/ThemeSwitcher';

interface ReportReasonDraft {
    id?: string;
    targetType: 'message' | 'user';
    label: string;
    enabled: boolean;
    subcategories: ReportSubcategoryDraft[];
}

interface ReportSubcategoryDraft {
    id?: string;
    label: string;
    enabled: boolean;
}

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
    if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
        return items;
    }

    const next = [...items];
    const [item] = next.splice(from, 1);
    if (item === undefined) return items;
    next.splice(to, 0, item);
    return next;
};

interface ReorderableItemProps<T> {
    ariaLabel: string;
    children: ReactNode;
    className: string;
    onMove: (offset: -1 | 1) => void;
    value: T;
}

const ReorderableItem = <T,>({
    ariaLabel,
    children,
    className,
    onMove,
    value,
}: ReorderableItemProps<T>): ReactNode => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            as="div"
            className={className}
            dragControls={controls}
            dragListener={false}
            value={value}
        >
            <div className="flex items-start gap-2">
                <button
                    aria-label={ariaLabel}
                    className="mt-1 shrink-0 touch-none cursor-grab select-none rounded p-1 text-muted-foreground hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
                    title="Drag to reorder, or use the arrow keys."
                    type="button"
                    onKeyDown={(event): void => {
                        if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            onMove(-1);
                        } else if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            onMove(1);
                        }
                    }}
                    onPointerDown={(event): void => controls.start(event)}
                >
                    <GripVertical aria-hidden="true" size={16} />
                </button>
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </Reorder.Item>
    );
};

const ReportReasonSettings = (): ReactNode => {
    const { data, isLoading, isError } = useAdminReportOptions();

    return (
        <section className="space-y-5">
            <div>
                <Heading level={2} variant="admin-page">
                    Report reasons
                </Heading>
                <Text as="p" size="sm" variant="muted">
                    Reorder, add, rename, and disable reasons and their
                    subcategories. Assign each reason to message reports or user
                    profiles. Deleting removes an entry from the catalog when
                    saved; existing reports keep their saved labels.
                </Text>
            </div>

            {isLoading ? (
                <Text as="p" size="sm" variant="muted">
                    Loading report reasons…
                </Text>
            ) : isError || !data ? (
                <Text as="p" size="sm" variant="danger">
                    Could not load report reasons. You need the viewReports
                    permission to manage them.
                </Text>
            ) : (
                <ReportReasonEditor initialOptions={data} />
            )}
        </section>
    );
};

const ReportReasonEditor = ({
    initialOptions,
}: {
    initialOptions: AdminReportReasonOption[];
}): ReactNode => {
    const update = useUpdateAdminReportOptions();
    const [saved, setSaved] = useState<ReportReasonDraft[]>(() =>
        initialOptions.map(
            ({ id, targetType, label, enabled, subcategories }) => ({
                id,
                targetType,
                label,
                enabled,
                subcategories: subcategories.map(({ id, label, enabled }) => ({
                    id,
                    label,
                    enabled,
                })),
            }),
        ),
    );
    const [draft, setDraft] = useState<ReportReasonDraft[]>(saved);
    const [deleteReasonIds, setDeleteReasonIds] = useState<string[]>([]);
    const [deleteSubcategoryIds, setDeleteSubcategoryIds] = useState<string[]>(
        [],
    );

    const hasChanges = JSON.stringify(draft) !== JSON.stringify(saved);
    const canSave =
        draft.length > 0 &&
        draft.length <= 50 &&
        (['message', 'user'] as const).every((targetType) =>
            draft.some(
                (option) => option.targetType === targetType && option.enabled,
            ),
        ) &&
        draft.every(
            (option) =>
                option.label.trim().length > 0 &&
                option.label.trim().length <= 80 &&
                option.subcategories.every(
                    (subcategory) =>
                        subcategory.label.trim().length > 0 &&
                        subcategory.label.trim().length <= 80,
                ),
        );

    const updateOption = (
        index: number,
        changes: Partial<ReportReasonDraft>,
    ): void => {
        setDraft((current) =>
            current.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ...changes } : option,
            ),
        );
    };

    const updateSubcategory = (
        optionIndex: number,
        subcategoryIndex: number,
        changes: Partial<ReportSubcategoryDraft>,
    ): void => {
        setDraft((current) =>
            current.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                    ? {
                          ...option,
                          subcategories: option.subcategories.map(
                              (subcategory, currentSubcategoryIndex) =>
                                  currentSubcategoryIndex === subcategoryIndex
                                      ? { ...subcategory, ...changes }
                                      : subcategory,
                          ),
                      }
                    : option,
            ),
        );
    };

    const moveOption = (index: number, offset: -1 | 1): void => {
        setDraft((current) => moveItem(current, index, index + offset));
    };

    const moveSubcategory = (
        optionIndex: number,
        subcategoryIndex: number,
        offset: -1 | 1,
    ): void => {
        setDraft((current) =>
            current.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                    ? {
                          ...option,
                          subcategories: moveItem(
                              option.subcategories,
                              subcategoryIndex,
                              subcategoryIndex + offset,
                          ),
                      }
                    : option,
            ),
        );
    };

    const removeOption = (index: number): void => {
        const id = draft[index]?.id;
        if (id) {
            setDeleteReasonIds((current) =>
                current.includes(id) ? current : [...current, id],
            );
        }
        setDraft((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const removeSubcategory = (
        optionIndex: number,
        subcategoryIndex: number,
    ): void => {
        const id = draft[optionIndex]?.subcategories[subcategoryIndex]?.id;
        if (id) {
            setDeleteSubcategoryIds((current) =>
                current.includes(id) ? current : [...current, id],
            );
        }
        setDraft((current) =>
            current.map((option, index) =>
                index === optionIndex
                    ? {
                          ...option,
                          subcategories: option.subcategories.filter(
                              (_, itemIndex) => itemIndex !== subcategoryIndex,
                          ),
                      }
                    : option,
            ),
        );
    };

    const handleSave = (): void => {
        const options = draft.map(
            ({ id, targetType, label, enabled, subcategories }) => ({
                ...(id ? { id } : {}),
                targetType,
                label: label.trim(),
                enabled,
                subcategories: subcategories.map(
                    ({
                        id: subcategoryId,
                        label: subcategoryLabel,
                        enabled: subcategoryEnabled,
                    }) => ({
                        ...(subcategoryId ? { id: subcategoryId } : {}),
                        label: subcategoryLabel.trim(),
                        enabled: subcategoryEnabled,
                    }),
                ),
            }),
        );
        const onSuccess = (options: AdminReportReasonOption[]): void => {
            const next = options.map(
                ({ id, targetType, label, enabled, subcategories }) => ({
                    id,
                    targetType,
                    label,
                    enabled,
                    subcategories: subcategories.map(
                        ({ id, label, enabled }) => ({
                            id,
                            label,
                            enabled,
                        }),
                    ),
                }),
            );
            setDraft(next);
            setSaved(next);
            setDeleteReasonIds([]);
            setDeleteSubcategoryIds([]);
        };

        if (deleteReasonIds.length > 0 || deleteSubcategoryIds.length > 0) {
            update.mutateWithDeletions(
                { options, deleteReasonIds, deleteSubcategoryIds },
                { onSuccess },
            );
        } else {
            update.mutate(options, { onSuccess });
        }
    };

    return (
        <div className="space-y-3">
            <Reorder.Group
                as="div"
                axis="y"
                className="space-y-3"
                values={draft}
                onReorder={setDraft}
            >
                {draft.map((option, index) => (
                    <ReorderableItem
                        ariaLabel={`Reorder report reason ${index + 1}: ${option.label || 'untitled'}`}
                        className="rounded-xl border border-border-subtle bg-bg-primary p-3"
                        key={option.id ?? `new-${index}`}
                        value={option}
                        onMove={(offset): void => moveOption(index, offset)}
                    >
                        <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    aria-label={`Report reason ${index + 1}`}
                                    className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary p-2"
                                    maxLength={80}
                                    value={option.label}
                                    onChange={(event): void =>
                                        updateOption(index, {
                                            label: event.target.value,
                                        })
                                    }
                                />
                                <select
                                    aria-label={`Report reason type ${index + 1}`}
                                    className="rounded-lg border border-border-subtle bg-bg-primary p-2"
                                    value={option.targetType}
                                    onChange={(event): void =>
                                        updateOption(index, {
                                            targetType: event.target.value as
                                                | 'message'
                                                | 'user',
                                        })
                                    }
                                >
                                    <option value="message">Message</option>
                                    <option value="user">User profile</option>
                                </select>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        checked={option.enabled}
                                        type="checkbox"
                                        onChange={(event): void =>
                                            updateOption(index, {
                                                enabled: event.target.checked,
                                            })
                                        }
                                    />
                                    Enabled
                                </label>
                                <Button
                                    disabled={option.subcategories.length >= 50}
                                    style={{
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                    variant="ghost"
                                    onClick={(): void =>
                                        updateOption(index, {
                                            subcategories: [
                                                ...option.subcategories,
                                                { label: '', enabled: true },
                                            ],
                                        })
                                    }
                                >
                                    Add subcategory
                                </Button>
                                <IconButton
                                    aria-label={`Delete report reason ${index + 1}: ${option.label || 'untitled'}`}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-danger"
                                    disabled={
                                        option.enabled &&
                                        draft.filter(
                                            (candidate) =>
                                                candidate.targetType ===
                                                    option.targetType &&
                                                candidate.enabled,
                                        ).length <= 1
                                    }
                                    icon={Trash2}
                                    iconSize={16}
                                    size="sm"
                                    square
                                    style={{
                                        border: '1px solid var(--border-subtle)',
                                    }}
                                    title={`Delete reason: ${option.label || 'untitled'}`}
                                    variant="ghost"
                                    onClick={(): void => removeOption(index)}
                                />
                            </div>
                            <Reorder.Group
                                as="div"
                                axis="y"
                                className="space-y-3"
                                values={option.subcategories}
                                onReorder={(subcategories): void =>
                                    updateOption(index, { subcategories })
                                }
                            >
                                {option.subcategories.map(
                                    (subcategory, subIndex) => (
                                        <ReorderableItem
                                            ariaLabel={`Reorder subcategory ${index + 1}.${subIndex + 1}: ${subcategory.label || 'untitled'}`}
                                            className="ml-4 border-l border-border-subtle pl-3"
                                            key={
                                                subcategory.id ??
                                                `new-sub-${subIndex}`
                                            }
                                            value={subcategory}
                                            onMove={(offset): void =>
                                                moveSubcategory(
                                                    index,
                                                    subIndex,
                                                    offset,
                                                )
                                            }
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <input
                                                    aria-label={`Subcategory ${index + 1}.${subIndex + 1}`}
                                                    className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-primary p-2"
                                                    maxLength={80}
                                                    value={subcategory.label}
                                                    onChange={(event): void =>
                                                        updateSubcategory(
                                                            index,
                                                            subIndex,
                                                            {
                                                                label: event
                                                                    .target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                />
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        checked={
                                                            subcategory.enabled
                                                        }
                                                        type="checkbox"
                                                        onChange={(
                                                            event,
                                                        ): void =>
                                                            updateSubcategory(
                                                                index,
                                                                subIndex,
                                                                {
                                                                    enabled:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    Enabled
                                                </label>
                                                <IconButton
                                                    aria-label={`Delete subcategory ${index + 1}.${subIndex + 1}`}
                                                    icon={Trash2}
                                                    iconSize={16}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-danger"
                                                    size="sm"
                                                    square
                                                    style={{
                                                        border: '1px solid var(--border-subtle)',
                                                    }}
                                                    title={`Delete subcategory ${subcategory.label || subIndex + 1}`}
                                                    variant="ghost"
                                                    onClick={(): void =>
                                                        removeSubcategory(
                                                            index,
                                                            subIndex,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </ReorderableItem>
                                    ),
                                )}
                            </Reorder.Group>
                        </div>
                    </ReorderableItem>
                ))}
            </Reorder.Group>

            <div className="flex flex-wrap gap-2">
                <Button
                    disabled={draft.length >= 50}
                    variant="normal"
                    onClick={(): void =>
                        setDraft((current) => [
                            ...current,
                            {
                                targetType: 'message',
                                label: '',
                                enabled: true,
                                subcategories: [],
                            },
                        ])
                    }
                >
                    Add reason
                </Button>
                <Button
                    disabled={!hasChanges || !canSave}
                    loading={update.isPending}
                    variant="primary"
                    onClick={handleSave}
                >
                    Save reasons
                </Button>
                <Button
                    disabled={!hasChanges || update.isPending}
                    variant="ghost"
                    onClick={(): void => {
                        setDraft(saved);
                        setDeleteReasonIds([]);
                        setDeleteSubcategoryIds([]);
                    }}
                >
                    Discard
                </Button>
            </div>
            {update.isError ? (
                <Text as="p" size="sm" variant="danger">
                    Could not save report reasons.
                </Text>
            ) : null}
        </div>
    );
};

export const AdminSettings = (): ReactNode => (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-5xl space-y-12 duration-700">
        <section className="space-y-6">
            <div>
                <Heading level={2} variant="admin-page">
                    Appearance
                </Heading>
                <Text as="p" size="sm" variant="muted">
                    Customize how Serchat looks and feels for your admin
                    session.
                </Text>
            </div>

            <ThemeSwitcher variant="admin" />
        </section>
        <ReportReasonSettings />
    </div>
);
