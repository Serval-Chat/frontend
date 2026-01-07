import { BouncingDots } from '@/ui/animations/BouncingDots';
import { Stack } from '@/ui/components/layout/Stack';
import { DemoSection } from './DemoSection';
import { DemoItem } from './DemoItem';
import { SHOWOFF_SECTIONS } from './config';

export function Animations() {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.animations} title="Animations">
            <Stack>
                <DemoItem id="bouncing-dots" title="Bouncing Dots (Wave)">
                    <BouncingDots size={4} />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
