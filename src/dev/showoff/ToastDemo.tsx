import type { ReactNode } from 'react';

import { Button } from '@/ui/primitives/Button';
import { Stack } from '@/ui/primitives/Stack';
import { useToast } from '@/ui/primitives/Toast';

import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const ToastDemo = (): ReactNode => {
    const { showToast } = useToast();

    return (
        <DemoSection id={SHOWOFF_SECTIONS.toast} title="Toast Notifications">
            <Stack wrap direction="row" gap="xs">
                <Button
                    variant="success"
                    onClick={(): void => {
                        showToast('Success toast example!', 'success');
                    }}
                >
                    Show Success Toast
                </Button>
                <Button
                    variant="danger"
                    onClick={(): void => {
                        showToast('Error toast example!', 'error');
                    }}
                >
                    Show Error Toast
                </Button>
                <Button
                    variant="primary"
                    onClick={(): void => {
                        showToast('Info toast example!', 'info');
                    }}
                >
                    Show Info Toast
                </Button>
            </Stack>
        </DemoSection>
    );
};
