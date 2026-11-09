import { useEmojiSheetLoaded } from '@/features/emoji/hooks/useEmojiSheetLoaded';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';
import { emojiMap, getSpriteStyle } from '@/utils/emoji';

interface ParsedUnicodeEmojiProps {
    content: string;
    className?: string;
    isLarge?: boolean;
    style?: React.CSSProperties;
}

export const ParsedUnicodeEmoji = ({
    content,
    className,
    isLarge,
    style,
}: ParsedUnicodeEmojiProps) => {
    const sheetLoaded = useEmojiSheetLoaded();
    const emojiData = emojiMap.get(content);

    if (!emojiData) {
        return (
            <Text className={className} style={style}>
                {content}
            </Text>
        );
    }

    return (
        <span
            aria-label={emojiData.short_name}
            className={cn(
                'inline-block shrink-0 overflow-hidden align-text-bottom',
                isLarge ? 'h-16 w-16' : 'h-[1.5em] w-[1.5em]',
                !sheetLoaded && 'animate-pulse rounded-full bg-bg-subtle',
                className,
            )}
            role="img"
            style={style}
            title={emojiData.short_name}
        >
            <span style={sheetLoaded ? getSpriteStyle(emojiData) : undefined} />
        </span>
    );
};
