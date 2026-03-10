import { PushPrompt } from '@/ui/components/common/PushPrompt';
import { DemoSection } from '@/ui/components/showoff/DemoSection';
import { SHOWOFF_SECTIONS } from '@/ui/components/showoff/config';

export const PushPromptDemo = (): React.ReactNode => (
    <DemoSection
        id={SHOWOFF_SECTIONS.pushPrompt}
        title="Push Notifications Prompt"
    >
        <div className="relative border border-dashed border-sidebar-border rounded-lg p-8 p-12 bg-sidebar flex items-center justify-center min-h-[200px] overflow-hidden">
            <PushPrompt />
        </div>
    </DemoSection>
);
