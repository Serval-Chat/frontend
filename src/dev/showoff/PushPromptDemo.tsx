import { PushPrompt } from '@/app/notifications/PushPrompt';
import { DemoSection } from '@/dev/showoff/DemoSection';
import { SHOWOFF_SECTIONS } from '@/dev/showoff/config';

export const PushPromptDemo = (): React.ReactNode => (
    <DemoSection
        id={SHOWOFF_SECTIONS.pushPrompt}
        title="Push Notifications Prompt"
    >
        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-subtle bg-bg-secondary p-8 p-12">
            <PushPrompt />
        </div>
    </DemoSection>
);
