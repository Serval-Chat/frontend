import { Input } from '@/ui/components/Input';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function InputsDemo() {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.inputs} title="Input elements">
            <div className="flex flex-col gap-md max-w-sm">
                <div id="input-normal" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">Normal Input</h3>
                    <Input placeholder="Type something..." />
                </div>
                <div id="input-disabled" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">
                        Disabled Input
                    </h3>
                    <Input disabled placeholder="Can't type here..." />
                </div>
                <div id="input-width" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">
                        Width Constrained (min: 200px, max: 300px)
                    </h3>
                    <Input
                        minWidth={200}
                        maxWidth={300}
                        placeholder="I have width limits..."
                    />
                </div>
            </div>
        </DemoSection>
    );
}
