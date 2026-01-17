import type { ReactNode } from 'react';

import { useFlashGroup } from '@/hooks/useFlashText';
import { Button } from '@/ui/components/common/Button';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoSection } from './DemoSection';
import { BUTTON_VARIANTS, SHOWOFF_SECTIONS } from './config';

export function ProcessingButtons(): ReactNode {
    const processingButtons = useFlashGroup({
        normal: { initial: 'Normal Processing', flash: 'Loading' },
        primary: { initial: 'Primary Processing', flash: 'Loading' },
        caution: { initial: 'Caution Processing', flash: 'Loading' },
        danger: { initial: 'Danger Processing', flash: 'Loading' },
        success: { initial: 'Success Processing', flash: 'Loading' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.processing}
            title="Processing buttons (graying out)"
        >
            <Stack wrap direction="row" gap="xs">
                {BUTTON_VARIANTS.map(({ id, type }) => (
                    <div className="p-xs" id={`${id}-processing`} key={id}>
                        <Button
                            loading={
                                processingButtons[
                                    id as keyof typeof processingButtons
                                ].isFlashing
                            }
                            variant={type}
                            onClick={
                                processingButtons[
                                    id as keyof typeof processingButtons
                                ].trigger
                            }
                        >
                            {
                                processingButtons[
                                    id as keyof typeof processingButtons
                                ].label
                            }
                        </Button>
                    </div>
                ))}
            </Stack>
        </DemoSection>
    );
}
