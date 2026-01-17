import type { ReactNode } from 'react';

import { Input } from '@/ui/components/common/Input';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function InputsDemo(): ReactNode {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.inputs} title="Input elements">
            <Stack className="max-w-sm">
                <DemoItem id="input-normal" title="Normal Input">
                    <Input placeholder="Type something..." />
                </DemoItem>
                <DemoItem id="input-disabled" title="Disabled Input">
                    <Input disabled placeholder="Can't type here..." />
                </DemoItem>
                <DemoItem id="input-password" title="Password Input">
                    <Input placeholder="Enter your secret..." type="password" />
                </DemoItem>
                <DemoItem id="input-number" title="Number Input">
                    <Input placeholder="Enter a number..." type="number" />
                </DemoItem>
                <DemoItem
                    id="input-width"
                    title="Width Constrained (min: 200px, max: 300px)"
                >
                    <Input
                        maxWidth={300}
                        minWidth={200}
                        placeholder="I have width limits..."
                    />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
