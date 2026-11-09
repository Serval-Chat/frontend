import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { removeAuthToken } from '@/utils/authToken';

interface BannedScreenProps {
    reason?: string;
    expirationTimestamp?: string | Date;
    onLogout?: () => void;
}

const formatExpiry = (ts: string | Date | undefined): string | null => {
    if (ts === undefined || ts === null) return null;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
    });
};

export const BannedScreen = ({
    reason,
    expirationTimestamp,
    onLogout,
}: BannedScreenProps) => {
    const expiry = formatExpiry(expirationTimestamp);

    const handleLogout = (): void => {
        if (onLogout === undefined) {
            void removeAuthToken();
        } else {
            onLogout();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-8 text-center">
            <div className="flex max-w-sm flex-col items-center gap-6">
                <Text as="p" size="2xl" variant="danger" weight="bold">
                    Account Suspended
                </Text>

                <div className="w-full rounded-lg border border-border-subtle bg-bg-subtle p-4 text-left text-sm">
                    <Text
                        as="p"
                        className="mb-1"
                        size="xs"
                        tracking="widest"
                        transform="uppercase"
                        variant="muted"
                        weight="semibold"
                    >
                        Reason
                    </Text>
                    <Text
                        as="p"
                        className="max-h-[50vh] overflow-y-auto break-words"
                        variant="default"
                        wrap="preWrap"
                    >
                        {reason !== undefined && reason !== ''
                            ? reason
                            : 'No reason provided.'}
                    </Text>

                    <div className="my-3 h-px bg-divider" />

                    <Text
                        as="p"
                        className="mb-1"
                        size="xs"
                        tracking="widest"
                        transform="uppercase"
                        variant="muted"
                        weight="semibold"
                    >
                        Duration
                    </Text>
                    <Text as="p" variant="default">
                        {expiry === null ? (
                            <Text variant="danger">Permanent</Text>
                        ) : (
                            <>Expires {expiry}</>
                        )}
                    </Text>
                </div>

                <Text as="p" size="xs" variant="muted">
                    If you believe this is a mistake, contact the instance
                    administrator.
                </Text>

                <Pressable
                    className="rounded border border-border-subtle bg-bg-subtle px-4 py-2 text-sm text-foreground hover:bg-bg-subtle/80"
                    onClick={handleLogout}
                >
                    Log out
                </Pressable>
            </div>
        </div>
    );
};
