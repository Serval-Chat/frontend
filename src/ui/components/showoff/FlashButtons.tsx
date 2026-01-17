import type { ReactNode } from 'react';

import { useFlashGroup } from '@/hooks/useFlashText';
import { Button } from '@/ui/components/common/Button';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoSection } from './DemoSection';
import { BUTTON_VARIANTS, SHOWOFF_SECTIONS } from './config';

export function FlashButtons(): ReactNode {
    const flashButtons = useFlashGroup({
        normal: { initial: 'Normal Button', flash: 'Clicked!' },
        primary: { initial: 'Primary Button', flash: 'Clicked!' },
        caution: { initial: 'Caution Button', flash: 'Clicked!' },
        danger: { initial: 'Dangerous Button', flash: 'Clicked!' },
        success: { initial: 'Success Button', flash: 'Clicked!' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.flash}
            title="Flash buttons (change text after click)"
        >
            <Stack wrap direction="row" gap="xs">
                {BUTTON_VARIANTS.map(({ id, type }) => (
                    <div className="p-xs" id={`${id}-flash`} key={id}>
                        <Button
                            variant={type}
                            onClick={
                                flashButtons[id as keyof typeof flashButtons]
                                    .trigger
                            }
                        >
                            {
                                flashButtons[id as keyof typeof flashButtons]
                                    .label
                            }
                        </Button>
                    </div>
                ))}
            </Stack>
        </DemoSection>
    );
}
