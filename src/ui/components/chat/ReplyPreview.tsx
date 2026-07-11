import React, {
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type { MessageAttachment } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { InteractionValue } from '@/types/interactions';
import { BotTag } from '@/ui/components/common/BotTag';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { parseText } from '@/utils/textParser/parser';
import { ParserFeature } from '@/utils/textParser/types';

interface ReplyPreviewProps {
    user: User;
    role?: Role;
    text: string;
    attachments?: MessageAttachment[];
    interaction?: {
        command: string;
        options?: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    } | null;
    replyToId?: string;
    isWebhook?: boolean;
    onClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
}

interface MeasuredReplyTextProps {
    text: string;
}

const REPLY_PREVIEW_FEATURES = [
    ParserFeature.MENTION,
    ParserFeature.ROLE_MENTION,
    ParserFeature.EVERYONE_MENTION,
    ParserFeature.EMOJI,
    ParserFeature.UNICODE_EMOJI,
] as const;

const truncateText = (text: string, length: number): string => {
    const next = text.slice(0, length).trimEnd();
    return next.length < text.length ? `${next}...` : next;
};

const getSingleLineHeight = (element: HTMLElement): number => {
    const styles = globalThis.getComputedStyle(element);
    const lineHeight = Number.parseFloat(styles.lineHeight);

    if (Number.isFinite(lineHeight)) {
        return lineHeight;
    }

    const fontSize = Number.parseFloat(styles.fontSize);
    return Number.isFinite(fontSize) ? fontSize * 1.2 : element.clientHeight;
};

const flattenReplyText = (text: string): string =>
    text
        .replaceAll(/```[\s\S]*?```/g, ' Code block ')
        .replaceAll(/`([^`]+)`/g, '$1')
        .replaceAll(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replaceAll(/^#{1,6}\s+/gm, '')
        .replaceAll(/^[-*_]{3,}\s*$/gm, ' ')
        .replaceAll(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
        .replaceAll(/^>\s?/gm, '')
        .replaceAll(/[*_~|]/g, '')
        .replaceAll(/\s+/g, ' ')
        .trim();

const MeasuredReplyText = React.memo(({ text }: MeasuredReplyTextProps) => {
    const flattenedText = useMemo((): string => flattenReplyText(text), [text]);
    const nodes = useMemo(
        () =>
            parseText(flattenedText, {
                features: REPLY_PREVIEW_FEATURES,
            }),
        [flattenedText],
    );
    const containerRef = useRef<HTMLSpanElement | null>(null);
    const observedWidthRef = useRef<number | null>(null);
    const [visibleText, setVisibleText] = useState(flattenedText);
    const visibleNodes = useMemo(
        () =>
            parseText(visibleText, {
                features: REPLY_PREVIEW_FEATURES,
            }),
        [visibleText],
    );

    const measure = useCallback((): void => {
        const container = containerRef.current;
        if (!container) return;

        const maxHeight = Math.ceil(getSingleLineHeight(container));

        if (container.scrollHeight <= maxHeight) {
            return;
        }

        const heightRatio = maxHeight / container.scrollHeight;
        const nextLength = Math.max(
            0,
            Math.floor(visibleText.length * heightRatio) - 3,
        );
        const nextText = truncateText(flattenedText, nextLength);

        setVisibleText((current): string =>
            nextText.length < current.length ? nextText : '...',
        );
    }, [flattenedText, visibleText]);

    useLayoutEffect((): (() => void) => {
        const frame = globalThis.requestAnimationFrame(measure);
        return (): void => {
            globalThis.cancelAnimationFrame(frame);
        };
    }, [measure]);

    useLayoutEffect((): (() => void) | undefined => {
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const observedElement = container.parentElement ?? container;
        const observer = new ResizeObserver(([entry]): void => {
            const width =
                entry?.contentRect.width ?? observedElement.clientWidth;
            if (observedWidthRef.current === width) return;

            observedWidthRef.current = width;
            setVisibleText(flattenedText);
        });
        observer.observe(observedElement);

        return (): void => {
            observer.disconnect();
        };
    }, [flattenedText]);

    return (
        <span
            className="block min-w-0 overflow-hidden leading-normal"
            ref={containerRef}
        >
            <ParsedText
                condenseFiles
                condenseInvites
                nodes={visibleText === flattenedText ? nodes : visibleNodes}
                size="xs"
                wrap="nowrap"
            />
        </span>
    );
});

MeasuredReplyText.displayName = 'MeasuredReplyText';

export const ReplyPreview = React.memo(
    ({
        user: initialUser,
        role,
        text,
        attachments,
        interaction,
        replyToId,
        isWebhook,
        onClick,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
    }: ReplyPreviewProps) => {
        const isUnknownUser = initialUser.username === 'Unknown';
        const { data: fetchedUser } = useUserById(initialUser.id, {
            enabled: isUnknownUser,
        });
        const user = isUnknownUser && fetchedUser ? fetchedUser : initialUser;

        const command = interaction?.command?.trim();
        const hasAttachments = (attachments?.length ?? 0) > 0;
        return (
            <Box
                className="group/reply ml-[24px] flex h-5 max-h-5 cursor-pointer items-center gap-2 overflow-hidden opacity-60 transition-opacity select-none hover:opacity-100"
                onClick={(): void | '' | undefined =>
                    replyToId && onClick?.(replyToId)
                }
            >
                {/* Spine */}
                <Box className="mt-[11px] h-[18px] w-[36px] flex-shrink-0 rounded-tl-lg border-t-2 border-l-2 border-border-subtle" />

                <Box className="flex h-5 min-w-0 items-center gap-1.5 overflow-hidden">
                    <UserProfilePicture
                        noIndicator
                        className="shrink-0"
                        size="xs"
                        src={user.profilePicture}
                        username={user.username}
                    />
                    <StyledUserName
                        showIcon
                        className="shrink-0 text-xs font-bold whitespace-nowrap opacity-90"
                        disableColors={disableColors}
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        disableGlowAndColors={disableGlowAndColors}
                        role={role}
                        user={user}
                    >
                        {user.nickname || user.displayName || user.username}
                    </StyledUserName>
                    {user.isBot ? (
                        <BotTag
                            className="h-3.5 shrink-0 px-1 text-[8px]"
                            verified={user.botVerified}
                        />
                    ) : null}
                    {isWebhook ? (
                        <BotTag
                            className="h-3.5 shrink-0 px-1 text-[8px]"
                            label="WEBHOOK"
                        />
                    ) : null}
                    <Text
                        as="span"
                        className="block h-5 min-w-0 flex-1 truncate text-xs leading-5 font-medium text-text-muted"
                    >
                        {command && !text ? (
                            <span className="mr-1 opacity-70">
                                used{' '}
                                <span className="text-primary">/{command}</span>
                            </span>
                        ) : null}
                        {!command && !text && hasAttachments ? (
                            <span className="opacity-70">Attachment(-s)</span>
                        ) : null}
                        {text ? (
                            <MeasuredReplyText key={text} text={text} />
                        ) : null}
                    </Text>
                </Box>
            </Box>
        );
    },
);

ReplyPreview.displayName = 'ReplyPreview';
