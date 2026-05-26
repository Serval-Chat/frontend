import React from 'react';

import { useUpdateCategory } from '@/api/servers/servers.queries';
import type { Category } from '@/api/servers/servers.types';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

import { MarkdownBlockadeSettings } from './MarkdownBlockadeSettings';

interface CategoryBehaviourSettingsProps {
    category: Category;
}

export const CategoryBehaviourSettings: React.FC<
    CategoryBehaviourSettingsProps
> = ({ category }) => {
    const { mutate: updateCategory, isPending } = useUpdateCategory(
        category.serverId,
        category._id,
    );

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Category Behaviour
                </Heading>
                <Text variant="muted">
                    Configure visual markdown rendering rules for channels in
                    this category.
                </Text>
            </div>
            <MarkdownBlockadeSettings
                isPending={isPending}
                rules={category.markdownBlockadeRules}
                serverId={category.serverId}
                onSave={(markdownBlockadeRules) =>
                    updateCategory({ markdownBlockadeRules })
                }
            />
        </div>
    );
};
