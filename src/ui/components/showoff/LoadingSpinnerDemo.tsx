import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function LoadingSpinnerDemo() {
    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.loadingSpinner}
            title="Loading Spinners"
        >
            <Stack>
                <DemoItem id="spinner-sm" title="Small Spinner (sm)">
                    <LoadingSpinner size="sm" />
                </DemoItem>
                <DemoItem id="spinner-md" title="Medium Spinner (md)">
                    <LoadingSpinner size="md" />
                </DemoItem>
                <DemoItem id="spinner-lg" title="Large Spinner (lg)">
                    <LoadingSpinner size="lg" />
                </DemoItem>
            </Stack>
        </DemoSection>
    );
}
