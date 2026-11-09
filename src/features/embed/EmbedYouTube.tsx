import type { Embed } from '@/types/embed';
import { Link } from '@/ui/primitives/Link';
import { Text } from '@/ui/primitives/Text';
import { cn } from '@/utils/cn';

interface EmbedYouTubeProps {
    embed: Embed;
    videoUrl: string;
    variant: 'preview' | 'chat';
    isDeleted?: boolean;
    onResize?: () => void;
}

export const EmbedYouTube = ({
    embed,
    videoUrl,
    variant,
    isDeleted,
    onResize,
}: EmbedYouTubeProps) => {
    const isShorts = embed.url?.includes('/shorts/') ?? false;
    return (
        <div
            className={cn(
                'mt-1 flex w-full flex-col overflow-hidden rounded-r-sm',
                isShorts ? 'max-w-[300px]' : 'max-w-[520px]',
            )}
            style={{
                borderLeft: '4px solid #ff0000',
            }}
        >
            <div
                className={cn(
                    'flex w-full flex-col rounded-r-sm',
                    variant === 'preview' ? 'bg-embed-bg' : 'bg-embed-bg/70',
                )}
            >
                {/* Provider */}
                <div className="px-4 pt-3 pb-1">
                    <Text
                        as="p"
                        className={cn(
                            'mb-0.5 text-xs',
                            isDeleted
                                ? 'text-danger/80'
                                : 'text-muted-foreground',
                        )}
                    >
                        {embed.provider?.url ? (
                            <Link
                                className="hover:underline"
                                href={embed.provider.url}
                            >
                                {embed.provider.name ?? 'YouTube'}
                            </Link>
                        ) : (
                            (embed.provider?.name ?? 'YouTube')
                        )}
                    </Text>

                    {/* Title */}
                    {embed.title ? (
                        <Text
                            as="p"
                            className={cn(
                                'mb-0.5 text-sm font-semibold',
                                isDeleted ? 'text-danger' : 'text-foreground',
                            )}
                        >
                            {embed.url ? (
                                <Link
                                    className="text-primary hover:underline"
                                    href={embed.url}
                                >
                                    {embed.title}
                                </Link>
                            ) : (
                                embed.title
                            )}
                        </Text>
                    ) : null}

                    {/* Author / channel */}
                    {embed.author?.name ? (
                        <Text
                            as="p"
                            className={cn(
                                'mb-2 text-xs',
                                isDeleted
                                    ? 'text-danger/80'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {embed.author.url ? (
                                <Link
                                    className="hover:underline"
                                    href={embed.author.url}
                                >
                                    {embed.author.name}
                                </Link>
                            ) : (
                                embed.author.name
                            )}
                        </Text>
                    ) : null}
                </div>

                <div
                    className={cn(
                        'relative w-full overflow-hidden',
                        isDeleted && 'opacity-50 grayscale',
                    )}
                    style={{
                        aspectRatio: isShorts ? '9 / 16' : '16 / 9',
                    }}
                >
                    <iframe
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-presentation allow-scripts allow-popups"
                        src={videoUrl}
                        title={embed.title ?? 'YouTube video'}
                        onLoad={onResize}
                    />
                </div>
            </div>
        </div>
    );
};
