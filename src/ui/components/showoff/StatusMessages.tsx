import type { ReactNode } from 'react';

import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function StatusMessages(): ReactNode {
    return (
        <DemoSection id={SHOWOFF_SECTIONS.status} title="Status Messages">
            <Stack className="max-w-sm w-full">
                <DemoItem id="status-error" title="Error Message">
                    <StatusMessage
                        message="Something went wrong. Please try again."
                        type="error"
                    />
                </DemoItem>
                <DemoItem id="status-success" title="Success Message">
                    <StatusMessage
                        message="Action completed successfully!"
                        type="success"
                    />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
