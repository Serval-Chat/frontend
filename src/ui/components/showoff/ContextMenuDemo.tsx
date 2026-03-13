/* eslint-disable no-console */
import React from 'react';

import { Copy, Edit, Info, Star, Trash } from 'lucide-react';

import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Text } from '@/ui/components/common/Text';

export const ContextMenuDemo: React.FC = () => {
    const exampleItems: ContextMenuItem[] = [
        {
            label: 'Primary Action',
            icon: Star,
            onClick: () => console.log('Primary clicked'),
            variant: 'primary',
        },
        {
            label: 'Success Action',
            icon: Star,
            onClick: () => console.log('Success clicked'),
            variant: 'success',
        },
        { type: 'divider' },
        {
            label: 'Example element 1',
            icon: Edit,
            onClick: () => console.log('Edit clicked'),
        },
        {
            label: 'Example element 2',
            icon: Copy,
            onClick: () => console.log('Copy clicked'),
        },
        { type: 'divider' },
        {
            label: 'Caution Action',
            icon: Info,
            onClick: () => console.log('Caution clicked'),
            variant: 'caution',
        },
        {
            label: 'Danger Action',
            icon: Trash,
            onClick: () => console.log('Delete clicked'),
            variant: 'danger',
        },
    ];

    return (
        <section className="space-y-4 py-8">
            <div id="context-menu">
                <Heading variant="sub">Context Menu (Right Click)</Heading>
            </div>

            <ContextMenu className="w-full" items={exampleItems}>
                <div className="group flex h-32 w-full cursor-context-menu flex-col items-center justify-center rounded-xl border-2 border-dashed border-[--color-border-subtle] bg-[--color-bg-subtle] p-md transition-colors hover:bg-[--color-bg-secondary]">
                    <Text>Right click me!</Text>
                    <MutedText className="mt-2 flex items-center justify-center">
                        <Info className="mr-1.5 h-3.5 w-3.5" />
                        Right click me (trust me)
                    </MutedText>
                </div>
            </ContextMenu>
        </section>
    );
};
