import { colors } from '@/ui/theme';
import { cn } from '@/utils/cn';

interface DividerProps {
    fullWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const Divider = ({ fullWidth, className, style }: DividerProps) => (
    <div
        className={cn(className)}
        style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBlock: '2px',
            paddingInline: fullWidth ? 0 : '12px',
            ...style,
        }}
    >
        <div
            style={{
                height: '3px',
                width: '100%',
                borderRadius: '9999px',
                backgroundColor: colors.divider,
            }}
        />
    </div>
);
