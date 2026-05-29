import type { ReactNode } from 'react';

import { Button } from '@/ui/components/common/Button';
import { useToast } from '@/ui/components/common/Toast';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export function ToastDemo(): ReactNode {
    const { showToast } = useToast();

    return (
        <DemoSection id={SHOWOFF_SECTIONS.toast} title="Toast Notifications">
            <Stack wrap direction="row" gap="xs">
                <Button
                    variant="success"
                    onClick={(): void =>
                        showToast('Success toast example!', 'success')
                    }
                >
                    Show Success Toast
                </Button>
                <Button
                    variant="danger"
                    onClick={(): void =>
                        showToast('Error toast example!', 'error')
                    }
                >
                    Show Error Toast
                </Button>
                <Button
                    variant="primary"
                    onClick={(): void =>
                        showToast('Info toast example!', 'info')
                    }
                >
                    Show Info Toast
                </Button>
            </Stack>
        </DemoSection>
    );
}
