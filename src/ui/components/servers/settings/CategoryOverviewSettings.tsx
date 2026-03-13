import React, { useState } from 'react';

import { Trash2 } from 'lucide-react';

import {
    useDeleteCategory,
    useUpdateCategory,
} from '@/api/servers/servers.queries';
import { type Category } from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';

interface CategoryOverviewSettingsProps {
    category: Category;
    onDeleted?: () => void;
}

export const CategoryOverviewSettings: React.FC<
    CategoryOverviewSettingsProps
> = ({ category, onDeleted }) => {
    const [name, setName] = useState(category.name);
    const [originalName, setOriginalName] = useState(category.name);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory(
        category.serverId,
        category._id,
    );
    const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory(
        category.serverId,
    );

    const [prevCategoryId, setPrevCategoryId] = useState(category._id);
    if (category._id !== prevCategoryId) {
        setPrevCategoryId(category._id);
        setName(category.name);
        setOriginalName(category.name);
    }

    const hasChanges = name !== originalName;

    const handleSave = (): void => {
        updateCategory(
            {
                name,
            },
            {
                onSuccess: () => {
                    setOriginalName(name);
                },
            },
        );
    };

    const handleReset = (): void => {
        setName(originalName);
    };

    const handleDelete = (): void => {
        deleteCategory(category._id, {
            onSuccess: () => {
                onDeleted?.();
            },
        });
    };

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Category Overview
                </Heading>
                <Text variant="muted">Update your category's name.</Text>
            </div>

            <div className="space-y-8">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="category-name"
                    >
                        Category Name
                    </label>
                    <Input
                        id="category-name"
                        placeholder="new-category"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-6 pt-10">
                <div className="border-b border-border-subtle pb-4">
                    <Heading className="text-error" level={2} variant="section">
                        Danger Zone
                    </Heading>
                </div>

                <div className="divide-y divide-border-subtle rounded-lg border border-bg-secondary">
                    <div className="flex items-center justify-between gap-4 p-4">
                        <div className="space-y-1">
                            <Text as="p" variant="danger" weight="bold">
                                Delete Category
                            </Text>
                            <Text as="p" size="xs" variant="muted">
                                Permanently delete this category. Channels
                                inside will become uncategorized. This action is
                                IRREVERSIBLE.
                            </Text>
                        </div>
                        <Button
                            className="min-w-[120px]"
                            variant="danger"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Category
                        </Button>
                    </div>
                </div>
            </div>

            <SettingsFloatingBar
                isPending={isUpdating}
                isVisible={hasChanges}
                onReset={handleReset}
                onSave={handleSave}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                className="max-w-md"
                isOpen={isDeleteConfirmOpen}
                title="Delete Category"
                onClose={() => setIsDeleteConfirmOpen(false)}
            >
                <div className="space-y-6">
                    <div className="border-status-error bg-status-error-bg text-status-error rounded-md border p-4 text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-bold">{category.name}</span>?
                        Channels within this category will not be deleted, but
                        will become uncategorized. This action cannot be undone.
                    </div>
                    <div className="-mx-6 -mb-6 flex justify-end gap-3 bg-bg-secondary p-6 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={isDeleting}
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Delete Category
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
