import { cn } from '@/utils/cn';
import { emojiMap, getSpriteStyle } from '@/utils/emoji';

interface ParsedUnicodeEmojiProps {
    content: string;
    className?: string;
    isLarge?: boolean;
}

export const ParsedUnicodeEmoji = ({
    content,
    className,
    isLarge,
}: ParsedUnicodeEmojiProps) => {
    const emojiData = emojiMap.get(content);

    if (!emojiData) {
        return <span className={className}>{content}</span>;
    }

    return (
        <span
            aria-label={emojiData.short_name}
            className={cn(
                'relative top-[0.1em] inline-block shrink-0 overflow-hidden align-middle',
                isLarge ? 'h-16 w-16' : 'h-[1.5em] w-[1.5em]',
                className,
            )}
            title={emojiData.short_name}
        >
            <span style={getSpriteStyle(emojiData)} />
        </span>
    );
};
