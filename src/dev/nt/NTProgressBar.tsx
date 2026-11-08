import { cn } from '@/utils/cn';

interface NTProgressBarProps {
    value: number;
    className?: string;
}

const TOTAL_BLOCKS = 24;

export const NTProgressBar = ({ value, className }: NTProgressBarProps) => {
    const clamped = Math.max(0, Math.min(100, value));
    const litBlocks = Math.floor((clamped / 100) * TOTAL_BLOCKS);

    return (
        <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={clamped}
            className={cn(
                'flex h-4 items-center gap-[2px] bg-white px-[2px]',
                className,
            )}
            role="progressbar"
            style={{
                border: '1px solid #808080',
                boxShadow: 'inset 1px 1px #000000, inset -1px -1px #dfdfdf',
            }}
        >
            {Array.from({ length: TOTAL_BLOCKS }, (_, index) => (
                <div
                    className="h-[75%] flex-1"
                    key={index}
                    style={{
                        backgroundColor:
                            index < litBlocks ? '#000080' : 'transparent',
                    }}
                />
            ))}
        </div>
    );
};
