import React from 'react';

import { Copy, Edit, Info, Star, Trash } from 'lucide-react';

import {
    ContextMenu,
    type ContextMenuItem,
} from '@/ui/components/common/ContextMenu';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { NormalText } from '@/ui/components/common/NormalText';

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

            <ContextMenu items={exampleItems} className="w-full">
                <div className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-[--color-border-subtle] rounded-xl bg-[--color-bg-subtle] hover:bg-[--color-bg-secondary] transition-colors cursor-context-menu group p-md">
                    <NormalText>Right click me!</NormalText>
                    <MutedText className="flex items-center justify-center mt-2">
                        <Info className="w-3.5 h-3.5 mr-1.5" />
                        Right click me (trust me)
                    </MutedText>
                </div>
            </ContextMenu>
        </section>
    );
};
