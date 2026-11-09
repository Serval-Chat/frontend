import { type CSSProperties, type ReactNode, memo, useState } from 'react';

import { ImageLightbox } from '@/ui/primitives/ImageLightbox';
import { Pressable } from '@/ui/primitives/Pressable';
import { cn } from '@/utils/cn';

interface EmbedImageProps {
    src: string | undefined;
    alt: string;
    className?: string;
    imageClassName: string;
    style?: CSSProperties;
    onResize?: () => void;
}

export const EmbedImage = memo(
    ({
        src,
        alt,
        className,
        imageClassName,
        style,
        onResize,
    }: EmbedImageProps): ReactNode => {
        const [isLightboxOpen, setIsLightboxOpen] = useState(false);

        if (!src) return null;

        return (
            <>
                <Pressable
                    aria-label={`View ${alt}`}
                    className={cn(
                        'cursor-pointer border-0 bg-transparent p-0 text-left',
                        className,
                    )}
                    onClick={(): void => {
                        setIsLightboxOpen(true);
                    }}
                >
                    <img
                        alt={alt}
                        className={imageClassName}
                        decoding="async"
                        loading="eager"
                        src={src}
                        style={style}
                        onLoad={onResize}
                    />
                </Pressable>
                <ImageLightbox
                    alt={alt}
                    isOpen={isLightboxOpen}
                    src={src}
                    onClose={(): void => {
                        setIsLightboxOpen(false);
                    }}
                />
            </>
        );
    },
);

EmbedImage.displayName = 'EmbedImage';
