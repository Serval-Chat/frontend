import type { ReactNode } from 'react';

import { useFlashGroup } from '@/hooks/useFlashText';
import { Button } from '@/ui/components/common/Button';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function RetainSizeButtons(): ReactNode {
    const flashButtons = useFlashGroup({
        normal: { initial: 'Normal Retain', flash: 'Clicked!' },
        caution: { initial: 'Caution Retain', flash: 'Clicked!' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.retain}
            title="Retain Size buttons (lock size after text change)"
        >
            <Stack wrap direction="row" gap="xs">
                <Button
                    retainSize
                    variant="normal"
                    onClick={flashButtons.normal.trigger}
                >
                    {flashButtons.normal.label}
                </Button>
                <Button
                    retainSize
                    variant="caution"
                    onClick={flashButtons.caution.trigger}
                >
                    {flashButtons.caution.label}
                </Button>
            </Stack>
        </DemoSection>
    );
}
