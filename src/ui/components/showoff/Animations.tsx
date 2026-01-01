import { BouncingDots } from '@/ui/animations/BouncingDots';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function Animations() {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.animations} title="Animations">
            <div className="flex flex-col gap-md">
                <div id="bouncing-dots" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">
                        Bouncing Dots (Wave)
                    </h3>
                    <BouncingDots size={4} />
                </div>
            </div>
        </DemoSection>
    );
}
