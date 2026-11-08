import { Button } from '@/ui/primitives/Button';
import { Text } from '@/ui/primitives/Text';

interface SessionVerificationErrorProps {
    isRetrying: boolean;
    onRetry: () => void;
}

export const SessionVerificationError = ({
    isRetrying,
    onRetry,
}: SessionVerificationErrorProps) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Text as="p" className="max-w-lg text-center" role="alert" size="sm">
            Serchat can’t verify your session while the server is unavailable.
            Your sign-in information has been kept. Try again when the server is
            reachable.
        </Text>
        <Button loading={isRetrying} variant="primary" onClick={onRetry}>
            Try again
        </Button>
    </div>
);
