import { PushPrompt } from '@/ui/components/common/PushPrompt';
import { DemoSection } from '@/ui/components/showoff/DemoSection';
import { SHOWOFF_SECTIONS } from '@/ui/components/showoff/config';

export const PushPromptDemo = (): React.ReactNode => (
    <DemoSection
        id={SHOWOFF_SECTIONS.pushPrompt}
        title="Push Notifications Prompt"
    >
        <div className="border-sidebar-border bg-sidebar relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg border border-dashed p-8 p-12">
            <PushPrompt />
        </div>
    </DemoSection>
);
