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
        if (onLogout !== undefined) {
            onLogout();
        } else {
            void removeAuthToken();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-8 text-center">
            <div className="flex max-w-sm flex-col items-center gap-6">
                <p className="text-2xl font-bold text-danger">
                    Account Suspended
                </p>

                <div className="border-border bg-surface w-full rounded-lg border p-4 text-left text-sm">
                    <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Reason
                    </p>
                    <p className="text-foreground">
                        {reason !== undefined && reason !== ''
                            ? reason
                            : 'No reason provided.'}
                    </p>

                    <div className="bg-border my-3 h-px" />

                    <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Duration
                    </p>
                    <p className="text-foreground">
                        {expiry === null ? (
                            <span className="text-danger">Permanent</span>
                        ) : (
                            <>Expires {expiry}</>
                        )}
                    </p>
                </div>

                <p className="text-xs text-muted-foreground">
                    If you believe this is a mistake, contact the instance
                    administrator.
                </p>

                <button
                    className="border-border bg-surface hover:bg-surface/80 rounded border px-4 py-2 text-sm text-foreground"
                    type="button"
                    onClick={handleLogout}
                >
                    Log out
                </button>
            </div>
        </div>
    );
};
