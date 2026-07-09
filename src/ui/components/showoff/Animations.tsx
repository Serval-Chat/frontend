import type { ReactNode } from 'react';

import { BouncingDots } from '@/ui/animations/BouncingDots';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const Animations = (): ReactNode => (
    <DemoSection id={SHOWOFF_SECTIONS.animations} title="Animations">
        <Stack>
            <DemoItem id="bouncing-dots" title="Bouncing Dots (Wave)">
                <BouncingDots size={4} />
            </DemoItem>
        </Stack>
    </DemoSection>
);
