import type { ReactNode } from 'react';
import { useState } from 'react';

import { Toggle } from '@/ui/components/common/Toggle';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function TogglesDemo(): ReactNode {
    const [normalChecked, setNormalChecked] = useState(false);
    const [labelChecked, setLabelChecked] = useState(true);
    const [disabledChecked, setDisabledChecked] = useState(true);

    return (
        <DemoSection id={SHOWOFF_SECTIONS.toggles} title="Toggle Switches">
            <Stack className="max-w-sm">
                <DemoItem id="toggle-normal" title="Normal Toggle">
                    <Toggle
                        checked={normalChecked}
                        onCheckedChange={setNormalChecked}
                    />
                </DemoItem>
                <DemoItem id="toggle-label" title="Toggle with Label">
                    <Toggle
                        checked={labelChecked}
                        label="Enable notifications"
                        onCheckedChange={setLabelChecked}
                    />
                </DemoItem>
                <DemoItem id="toggle-disabled" title="Disabled Toggle">
                    <Toggle
                        disabled
                        checked={disabledChecked}
                        label="Disabled option"
                        onCheckedChange={setDisabledChecked}
                    />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
