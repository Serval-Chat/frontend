import React from 'react';

import { decompressFrames, parseGIF } from 'gifuct-js';

interface PausedAnimatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    paused: boolean;
}

export const PausedAnimatedImage = ({
    fallbackSrc,
    paused,
    src,
    alt,
    className,
    style,
    onLoad,
    ...props
}: PausedAnimatedImageProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        if (!paused || !src) return;

        let cancelled = false;

        const drawFirstFrame = async (): Promise<void> => {
            try {
                setFailed(false);
                const response = await fetch(src);
                const buffer = await response.arrayBuffer();
                if (cancelled) return;

                const gif = parseGIF(buffer);
                const [frame] = decompressFrames(gif, true);
                const canvas = canvasRef.current;
                if (!frame || !canvas) return;

                canvas.width = gif.lsd.width;
                canvas.height = gif.lsd.height;

                const context = canvas.getContext('2d');
                if (!context) return;

                const imageData = new ImageData(
                    new Uint8ClampedArray(frame.patch),
                    frame.dims.width,
                    frame.dims.height,
                );
                context.putImageData(
                    imageData,
                    frame.dims.left,
                    frame.dims.top,
                );
                onLoad?.({} as React.SyntheticEvent<HTMLImageElement, Event>);
            } catch {
                if (!cancelled) setFailed(true);
            }
        };

        void drawFirstFrame();

        return () => {
            cancelled = true;
        };
    }, [onLoad, paused, src]);

    if (!paused || failed) {
        return (
            <img
                alt={alt}
                className={className}
                src={failed ? fallbackSrc || src : src}
                style={style}
                onLoad={onLoad}
                {...props}
            />
        );
    }

    return (
        <canvas
            aria-label={alt}
            className={className}
            ref={canvasRef}
            role={alt ? 'img' : undefined}
            style={style}
        />
    );
};
