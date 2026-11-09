import { type ReactNode, memo } from 'react';

import type { ButtonComponent } from '@/types/embed';
import { Link } from '@/ui/primitives/Link';
import { Pressable } from '@/ui/primitives/Pressable';
import { cn } from '@/utils/cn';

interface EmbedButtonsProps {
    buttons: ButtonComponent[] | undefined;
    serverId?: string;
    channelId?: string;
    messageId?: string;
    isDeleted?: boolean;
    pendingButtonKey?: string | null;
    onButtonClick: (componentIndex: number, button: ButtonComponent) => void;
}

export const EmbedButtons = memo(
    ({
        buttons,
        serverId,
        channelId,
        messageId,
        isDeleted,
        pendingButtonKey,
        onButtonClick,
    }: EmbedButtonsProps): ReactNode => {
        const visibleButtons = buttons
            ?.filter(
                (component): component is ButtonComponent =>
                    component.type === 'button',
            )
            .slice(0, 8);
        if (!visibleButtons || visibleButtons.length === 0) return null;

        return (
            <div className="mt-2 flex flex-wrap gap-2">
                {visibleButtons.map((button, buttonIndex) => {
                    const buttonKey = `${button.custom_id ?? button.url ?? buttonIndex}`;
                    const disabled =
                        button.disabled === true ||
                        isDeleted === true ||
                        pendingButtonKey === buttonKey ||
                        (button.style !== 'link' &&
                            (!serverId ||
                                !channelId ||
                                !messageId ||
                                !button.custom_id));
                    const label =
                        button.label ?? button.emoji?.name ?? 'Button';
                    const className = cn(
                        'rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                        button.style === 'primary' &&
                            'bg-primary text-foreground hover:bg-primary/90',
                        button.style === 'secondary' &&
                            'bg-bg-secondary text-foreground hover:bg-bg-secondary/80',
                        button.style === 'success' &&
                            'bg-success text-white hover:bg-success/90',
                        button.style === 'danger' &&
                            'bg-danger text-white hover:bg-danger/90',
                        button.style === 'link' &&
                            'border border-border-subtle bg-transparent text-primary hover:bg-bg-secondary',
                    );

                    if (button.style === 'link' && button.url) {
                        return (
                            <Link
                                external
                                className={className}
                                href={button.url}
                                key={buttonKey}
                            >
                                {label}
                            </Link>
                        );
                    }

                    return (
                        <Pressable
                            className={className}
                            disabled={disabled}
                            key={buttonKey}
                            onClick={(): void => {
                                onButtonClick(buttonIndex, button);
                            }}
                        >
                            {label}
                        </Pressable>
                    );
                })}
            </div>
        );
    },
);

EmbedButtons.displayName = 'EmbedButtons';
