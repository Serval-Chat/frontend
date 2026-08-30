import type { CopyJob } from '@/hooks/nt/useCopyDialog';
import { NTButton } from '@/ui/components/nt/NTButton';
import { NTProgressBar } from '@/ui/components/nt/NTProgressBar';
import { Window } from '@/ui/components/nt/Window';

interface CopyDialogProps {
    job: CopyJob;
    onCancel: () => void;
}

export const CopyDialog = ({ job, onCancel }: CopyDialogProps) => (
    <Window
        defaultHeight={150}
        defaultWidth={360}
        defaultX={160}
        defaultY={180}
        minHeight={150}
        minWidth={360}
        resizable={false}
        title="Copying..."
        onClose={onCancel}
    >
        <div className="flex flex-1 flex-col gap-2 bg-[#c0c0c0] p-3 font-nt text-[11px] leading-[13px]">
            <div className="truncate font-bold">{job.fileName}</div>
            <div className="truncate">
                From &apos;{job.from}&apos; to &apos;{job.to}&apos;
            </div>
            <div className="flex items-center gap-2">
                <NTProgressBar className="flex-1" value={job.progress} />
                <NTButton className="shrink-0" onClick={onCancel}>
                    Cancel
                </NTButton>
            </div>
            <div>
                {job.secondsRemaining} Second
                {job.secondsRemaining === 1 ? '' : 's'} Remaining
            </div>
        </div>
    </Window>
);
