import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Stack } from '@/ui/components/layout/Stack';
import { DemoSection } from './DemoSection';
import { DemoItem } from './DemoItem';
import { SHOWOFF_SECTIONS } from './config';

export function StatusMessages() {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.status} title="Status Messages">
            <Stack className="max-w-sm w-full">
                <DemoItem id="status-error" title="Error Message">
                    <StatusMessage
                        type="error"
                        message="Something went wrong. Please try again."
                    />
                </DemoItem>
                <DemoItem id="status-success" title="Success Message">
                    <StatusMessage
                        type="success"
                        message="Action completed successfully!"
                    />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
