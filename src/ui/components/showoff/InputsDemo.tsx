import { Input } from '@/ui/components/common/Input';
import { Stack } from '@/ui/components/layout/Stack';
import { DemoSection } from './DemoSection';
import { DemoItem } from './DemoItem';
import { SHOWOFF_SECTIONS } from './config';

export function InputsDemo() {
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
                    <Input type="password" placeholder="Enter your secret..." />
                </DemoItem>
                <DemoItem id="input-number" title="Number Input">
                    <Input type="number" placeholder="Enter a number..." />
                </DemoItem>
                <DemoItem
                    id="input-width"
                    title="Width Constrained (min: 200px, max: 300px)"
                >
                    <Input
                        minWidth={200}
                        maxWidth={300}
                        placeholder="I have width limits..."
                    />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
