import { Button } from '@/ui/components/Button';
import { useFlashGroup } from '@/hooks/useFlashText';
import { Stack } from '@/ui/components/Stack';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function RetainSizeButtons() {
    const flashButtons = useFlashGroup({
        normal: { initial: 'Normal Retain', flash: 'Clicked!' },
        caution: { initial: 'Caution Retain', flash: 'Clicked!' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.retain}
            title="Retain Size buttons (lock size after text change)"
        >
            <Stack direction="row" gap="xs" wrap>
                <Button
                    variant="normal"
                    onClick={flashButtons.normal.trigger}
                    retainSize={true}
                >
                    {flashButtons.normal.label}
                </Button>
                <Button
                    variant="caution"
                    onClick={flashButtons.caution.trigger}
                    retainSize={true}
                >
                    {flashButtons.caution.label}
                </Button>
            </Stack>
        </DemoSection>
    );
}
