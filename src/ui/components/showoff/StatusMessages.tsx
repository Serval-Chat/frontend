import { StatusMessage } from '@/ui/components/StatusMessage';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function StatusMessages() {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.status} title="Status Messages">
            <div className="flex flex-col gap-md max-w-sm w-full">
                <div id="status-error" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">Error Message</h3>
                    <StatusMessage
                        type="error"
                        message="Something went wrong. Please try again."
                    />
                </div>
                <div id="status-success" className="p-xs">
                    <h3 className="text-md font-medium mb-sm">
                        Success Message
                    </h3>
                    <StatusMessage
                        type="success"
                        message="Action completed successfully!"
                    />
                </div>
            </div>
        </DemoSection>
    );
}
