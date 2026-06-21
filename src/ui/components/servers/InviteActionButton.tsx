import { Button } from '@/ui/components/common/Button';

export type InviteActionState = 'idle' | 'pending' | 'sent';

interface InviteActionButtonProps {
    state: InviteActionState;
    onClick: () => void;
}

export const InviteActionButton = ({
    state,
    onClick,
}: InviteActionButtonProps) => (
    <Button
        disabled={state !== 'idle'}
        loading={state === 'pending'}
        size="sm"
        variant={state === 'sent' ? 'ghost' : 'primary'}
        onClick={onClick}
    >
        {state === 'sent' ? 'Sent' : 'Invite'}
    </Button>
);
