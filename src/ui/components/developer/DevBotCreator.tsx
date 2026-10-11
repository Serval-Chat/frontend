import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useCreateBot } from '@/hooks/developer/useBots';
import { Button } from '@/ui/components/common/Button';
import { CopyInput } from '@/ui/components/common/CopyInput';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { colors } from '@/ui/theme';
import { censorToken } from '@/utils/censorToken';

export const DevBotCreator = (): ReactNode => {
    const [name, setName] = useState('');
    const [newToken, setNewToken] = useState<string | null>(null);
    const [createdClientId, setCreatedClientId] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const createBot = useCreateBot();
    const navigate = useNavigate();
    const tokenCardRef = useRef<HTMLDivElement>(null);
    const tokenFieldRef = useRef<HTMLInputElement>(null);
    const submittingRef = useRef(false);
    const [tokenSizing, setTokenSizing] = useState<{
        boxMinWidth: number;
        noteMaxWidth: number;
    } | null>(null);

    useLayoutEffect((): (() => void) | undefined => {
        const card = tokenCardRef.current;
        const field = tokenFieldRef.current;
        if (card === null || field === null || newToken === null) return;

        let cancelled = false;

        const measure = (): void => {
            const fieldStyle = getComputedStyle(field);
            const probe = document.createElement('span');
            probe.style.cssText = [
                'position: absolute',
                'visibility: hidden',
                'white-space: pre',
                'box-sizing: border-box',
                `font-family: ${fieldStyle.fontFamily}`,
                `font-size: ${fieldStyle.fontSize}`,
                `font-weight: ${fieldStyle.fontWeight}`,
                `letter-spacing: ${fieldStyle.letterSpacing}`,
                `padding: ${fieldStyle.paddingTop} ${fieldStyle.paddingRight} ${fieldStyle.paddingBottom} ${fieldStyle.paddingLeft}`,
                `border: ${fieldStyle.borderTopWidth} ${fieldStyle.borderTopStyle} ${fieldStyle.borderTopColor}`,
            ].join('; ');
            probe.textContent = field.value;
            document.body.append(probe);
            const needed = probe.getBoundingClientRect().width;
            probe.remove();
            if (needed <= 0 || cancelled) return;

            const cardStyle = getComputedStyle(card);
            const gutter =
                (Number.parseFloat(cardStyle.paddingLeft) || 0) +
                (Number.parseFloat(cardStyle.paddingRight) || 0);
            setTokenSizing({
                boxMinWidth: needed + gutter,
                noteMaxWidth: needed,
            });
        };

        measure();
        const fontsReady = document.fonts?.ready;
        if (typeof fontsReady?.then === 'function') {
            void fontsReady.then(() => {
                if (!cancelled) measure();
            });
        }

        return (): void => {
            cancelled = true;
        };
    }, [newToken]);

    const leave = (): void => {
        // Leaving after creation silently discards the one-time token; the
        // form screen has nothing to lose, so only gate the token screen.
        if (
            newToken !== null &&
            !globalThis.confirm(
                "Leave without saving your bot token? You can reset it later from the bot's settings.",
            )
        ) {
            return;
        }
        void navigate('/developer/bots');
    };

    const openCreatedBot = (): void => {
        void navigate(
            createdClientId === null
                ? '/developer/bots'
                : `/developer/bots/${createdClientId}`,
        );
    };

    const handleSubmit = (): void => {
        if (!name.trim() || submittingRef.current || createBot.isPending) {
            return;
        }
        // isPending only flips on the render after mutate(), so a second click
        // in the same tick would fire twice without this ref.
        submittingRef.current = true;
        createBot.mutate(
            { name: name.trim() },
            {
                onError: (): void => {
                    submittingRef.current = false;
                },
                onSuccess: (data): void => {
                    setNewToken(data.token);
                    setCreatedClientId(data.bot.clientId);
                },
            },
        );
    };

    return (
        <div className="flex flex-col gap-5 pb-12">
            <button
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                type="button"
                onClick={leave}
            >
                <ArrowLeft size={14} />
                Back to bots
            </button>

            {newToken !== null ? (
                <div
                    className="w-fit max-w-full rounded-xl border border-border-subtle bg-bg-secondary p-5"
                    ref={tokenCardRef}
                    style={{
                        minWidth:
                            tokenSizing === null
                                ? undefined
                                : `min(${tokenSizing.boxMinWidth}px, 100%)`,
                    }}
                >
                    <p className="mb-4 font-semibold text-foreground">
                        Bot Created
                    </p>
                    <div className="flex flex-col gap-4">
                        <Text
                            as="p"
                            size="sm"
                            style={{ maxWidth: tokenSizing?.noteMaxWidth }}
                            variant="muted"
                        >
                            Your bot token is shown below. Copy it now; it
                            won&apos;t be shown again. You can reset it later
                            from the bot&apos;s settings.
                        </Text>
                        <CopyInput
                            readOnly
                            aria-label={
                                revealed ? 'Bot token' : 'Bot token (censored)'
                            }
                            copyLabel="Copy token"
                            copyValue={newToken}
                            ref={tokenFieldRef}
                            style={{
                                backgroundColor: colors.cautionMuted,
                                color: colors.cautionMutedText,
                                fontFamily: 'var(--font-mono)',
                            }}
                            value={revealed ? newToken : censorToken(newToken)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={(): void => {
                                    setRevealed((r): boolean => !r);
                                }}
                            >
                                {revealed ? 'Hide token' : 'Show token'}
                            </Button>
                            <Button variant="primary" onClick={openCreatedBot}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl rounded-xl border border-border-subtle bg-bg-secondary p-5">
                    <p className="mb-4 font-semibold text-foreground">
                        Bot Details
                    </p>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-sm font-medium text-foreground"
                                htmlFor="bot-name"
                            >
                                Name
                            </label>
                            <Input
                                id="bot-name"
                                maxLength={32}
                                placeholder="My Awesome Bot"
                                value={name}
                                onChange={(e): void => {
                                    setName(e.target.value);
                                }}
                                onKeyDown={(e): void => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={leave}>
                                Cancel
                            </Button>
                            <Button
                                loading={createBot.isPending}
                                variant="primary"
                                onClick={handleSubmit}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
