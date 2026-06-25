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
    const [isGif, setIsGif] = React.useState<boolean | null>(null);
    const [firstFrameDrawn, setFirstFrameDrawn] = React.useState(false);
    const [failedToLoad, setFailedToLoad] = React.useState(false);

    React.useEffect(() => {
        if (!src || !paused) return;

        let cancelled = false;

        const drawFirstFrame = async (): Promise<void> => {
            try {
                const response = await fetch(src);
                const buffer = await response.arrayBuffer();
                if (cancelled) return;

                const gif = parseGIF(buffer);
                const [frame] = decompressFrames(gif, true);
                if (cancelled) return;

                setIsGif(true);

                setTimeout(() => {
                    if (cancelled) return;
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
                    setFirstFrameDrawn(true);
                }, 0);
            } catch {
                if (!cancelled) {
                    setIsGif(false);
                }
            }
        };

        if (isGif !== false) {
            void drawFirstFrame();
        }

        return () => {
            cancelled = true;
        };
    }, [paused, src, isGif]);

    const showImg =
        !paused ||
        isGif === false ||
        (isGif === true && !firstFrameDrawn) ||
        isGif === null;

    return (
        <>
            <img
                alt={alt}
                className={className}
                src={isGif === false && failedToLoad ? fallbackSrc || src : src}
                style={{ ...style, display: showImg ? undefined : 'none' }}
                onError={() => setFailedToLoad(true)}
                onLoad={onLoad}
                {...props}
            />
            {paused && isGif === true && (
                <canvas
                    aria-label={alt}
                    className={className}
                    ref={canvasRef}
                    role={alt ? 'img' : undefined}
                    style={{
                        ...style,
                        display: firstFrameDrawn ? undefined : 'none',
                    }}
                />
            )}
        </>
    );
};
