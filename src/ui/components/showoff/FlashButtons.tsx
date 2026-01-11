import { useFlashGroup } from '@/hooks/useFlashText';
import { Button } from '@/ui/components/common/Button';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoSection } from './DemoSection';
import { BUTTON_VARIANTS, SHOWOFF_SECTIONS } from './config';

export function FlashButtons() {
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
            <Stack direction="row" gap="xs" wrap>
                {BUTTON_VARIANTS.map(({ id, type }) => (
                    <div key={id} id={`${id}-flash`} className="p-xs">
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
