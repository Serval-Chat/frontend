import { Button } from '@/ui/components/Button';
import { useFlashGroup } from '@/hooks/useFlashText';
import { Stack } from '@/ui/components/Stack';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS, BUTTON_VARIANTS } from './config';

export function ProcessingButtons() {
    const processingButtons = useFlashGroup({
        normal: { initial: 'Normal Processing', flash: 'Loading' },
        caution: { initial: 'Caution Processing', flash: 'Loading' },
        danger: { initial: 'Danger Processing', flash: 'Loading' },
        success: { initial: 'Success Processing', flash: 'Loading' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.processing}
            title="Processing buttons (graying out)"
        >
            <Stack direction="row" gap="xs" wrap>
                {BUTTON_VARIANTS.map(({ id, type }) => (
                    <div key={id} id={`${id}-processing`} className="p-xs">
                        <Button
                            variant={type}
                            onClick={
                                processingButtons[
                                    id as keyof typeof processingButtons
                                ].trigger
                            }
                            loading={
                                processingButtons[
                                    id as keyof typeof processingButtons
                                ].isFlashing
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
