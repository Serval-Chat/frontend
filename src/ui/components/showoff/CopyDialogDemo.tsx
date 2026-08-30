import type { ReactNode } from 'react';

import { useCopyDialog } from '@/hooks/nt/useCopyDialog';
import { Button } from '@/ui/components/common/Button';
import { CopyDialog } from '@/ui/components/nt/CopyDialog';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const CopyDialogDemo = (): ReactNode => {
    const { job, runCopy, cancel } = useCopyDialog();

    return (
        <DemoSection id={SHOWOFF_SECTIONS.copyDialog} title="Retro Copy Dialog">
            <DemoItem
                id="copy-dialog-trigger"
                title="Fake 'Copying...' window (shown by the console UPLOAD command)"
            >
                <Button
                    disabled={job !== null}
                    variant="normal"
                    onClick={(): void => {
                        void runCopy({
                            fileName: 'PUPIL.PLIST',
                            from: 'Your Computer',
                            size: 4000,
                            to: 'C:\\PUPIL.PLIST',
                        });
                    }}
                >
                    Start Fake Copy
                </Button>
            </DemoItem>
            {job ? <CopyDialog job={job} onCancel={cancel} /> : null}
        </DemoSection>
    );
};
