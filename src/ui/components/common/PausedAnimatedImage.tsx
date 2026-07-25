import React from 'react';

import { decompressFrames, parseGIF } from 'gifuct-js';

interface PausedAnimatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    paused: boolean;
}

interface DecodedGifFrame {
    width: number;
    height: number;
    frame: {
        patch: Uint8ClampedArray | Uint8Array | number[];
        dims: {
            width: number;
            height: number;
            left: number;
            top: number;
        };
    };
}

const bufferCache = new Map<string, Promise<ArrayBuffer>>();
const decodedFrameCache = new Map<string, Promise<DecodedGifFrame>>();

const fetchGifBuffer = (src: string): Promise<ArrayBuffer> => {
    const existing = bufferCache.get(src);
    if (existing) return existing;

    const promise = fetch(src)
        .then((res) => {
            if (!res.ok) {
                bufferCache.delete(src);
                throw new Error(`Failed to fetch image: ${res.status}`);
            }
            return res.arrayBuffer();
        })
        .catch((err) => {
            bufferCache.delete(src);
            throw err;
        });
    bufferCache.set(src, promise);
    return promise;
};

const getDecodedGifFrame = (src: string): Promise<DecodedGifFrame> => {
    const existing = decodedFrameCache.get(src);
    if (existing) return existing;

    const promise = (async () => {
        const buffer = await fetchGifBuffer(src);
        const gif = parseGIF(buffer);
        const [frame] = decompressFrames(gif, true);
        if (!frame) throw new Error('No frames in GIF');
        return {
            width: gif.lsd.width,
            height: gif.lsd.height,
            frame,
        };
    })().catch((err) => {
        decodedFrameCache.delete(src);
        throw err;
    });
    decodedFrameCache.set(src, promise);
    return promise;
};

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

    // react-doctor-disable-next-line react-doctor/no-fetch-in-effect, react-doctor/no-effect-event-handler
    React.useEffect(() => {
        if (!src || !paused) return;

        let cancelled = false;

        const drawFirstFrame = async (): Promise<void> => {
            try {
                const decoded = await getDecodedGifFrame(src);
                if (cancelled) return;

                setIsGif(true);

                setTimeout(() => {
                    if (cancelled) return;
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const { width, height, frame } = decoded;
                    canvas.width = width;
                    canvas.height = height;

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
                onError={() => {
                    setFailedToLoad(true);
                }}
                onLoad={onLoad}
                {...props}
            />
            {paused && isGif === true ? (
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
            ) : null}
        </>
    );
};
