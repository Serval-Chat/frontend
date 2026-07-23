import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import DOMPurify from 'dompurify';
import { RotateCcw, Workflow, ZoomIn, ZoomOut } from 'lucide-react';
import mermaid from 'mermaid';

import { useTheme } from '@/providers/ThemeProvider';

import { Button } from './Button';
import { Modal } from './Modal';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

interface MermaidChartProps {
    content: string;
}

interface MermaidChartRendererProps extends MermaidChartProps {
    onRendered?: (size: { width: number; height: number }) => void;
}

const DEFAULT_FONT = "'Noto Sans', system-ui, -apple-system, sans-serif";

const resolveThemeVariables = (): Record<string, string> => {
    if (globalThis.window === undefined) return {};

    const style = getComputedStyle(document.documentElement);

    const getVar = (name: string, fallback: string): string => {
        let value = style.getPropertyValue(name).trim();
        if (value.startsWith('var(')) {
            const match = /var\((--[^)]+)\)/.exec(value);
            if (match?.[1]) {
                value = style.getPropertyValue(match[1]).trim();
            }
        }
        return value || fallback;
    };

    const isDark =
        document.documentElement.classList.contains('theme-dark') ||
        document.documentElement.classList.contains('theme-deep-ocean') ||
        document.documentElement.classList.contains('theme-violet') ||
        document.documentElement.classList.contains('theme-forest-green');

    const bgPrimary = getVar('--background', isDark ? '#18181b' : '#ffffff');
    const bgSecondary = getVar(
        '--bg-secondary',
        isDark ? '#27272a' : '#f4f4f5',
    );
    const fg = getVar('--foreground', isDark ? '#ffffff' : '#000000');
    const mutedFg = getVar('--muted-foreground', '#888888');
    const primary = getVar('--primary', '#3b82f6');
    const primaryMuted = getVar(
        '--primary-muted',
        isDark ? '#1e3a8a' : '#dbeafe',
    );

    return {
        primaryColor: primaryMuted,
        primaryTextColor: fg,
        primaryBorderColor: primary,
        lineColor: mutedFg,
        secondaryColor: getVar('--success-muted', '#dcfce7'),
        tertiaryColor: getVar('--caution-muted', '#fef3c7'),

        mainBkg: bgSecondary,
        nodeBkg: bgSecondary,
        nodeBorder: getVar('--border-subtle', 'rgba(0,0,0,0.1)'),
        clusterBkg: getVar('--bg-subtle', bgSecondary),
        clusterBorder: getVar('--divider', 'rgba(0,0,0,0.1)'),

        nodeTextColor: fg,
        defaultLinkColor: mutedFg,
        titleColor: fg,
        edgeLabelBackground: bgPrimary,

        fontFamily: getVar('--font-sans', DEFAULT_FONT),
        fontSize: '14px',

        tertiaryTextColor: fg,
        secondaryTextColor: fg,
    };
};

const MermaidChartRenderer = ({
    content,
    onRendered,
}: MermaidChartRendererProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const onRenderedRef = useRef(onRendered);
    useLayoutEffect((): void => {
        onRenderedRef.current = onRendered;
    });

    const { theme } = useTheme();

    useEffect((): void => {
        const renderChart = async (): Promise<void> => {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: resolveThemeVariables(),
                    securityLevel: 'strict',
                    htmlLabels: false,
                });

                const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
                const { svg } = await mermaid.render(id, content);
                setSvgContent(svg);
                setError(null);
            } catch (error_: unknown) {
                console.error('Mermaid render error:', error_);
                setError(
                    error_ instanceof Error
                        ? error_.message
                        : 'Failed to render chart',
                );
            }
        };

        void renderChart();
    }, [content, theme]);

    useEffect((): void => {
        if (!svgContent) return;
        const svgEl = containerRef.current?.querySelector('svg');
        if (!svgEl) return;

        const viewBox = svgEl.viewBox.baseVal;
        const rect = svgEl.getBoundingClientRect();
        const width = viewBox && viewBox.width > 0 ? viewBox.width : rect.width;
        const height =
            viewBox && viewBox.height > 0 ? viewBox.height : rect.height;
        if (width > 0 && height > 0) {
            onRenderedRef.current?.({ width, height });
        }
    }, [svgContent]);

    if (error) {
        return (
            <div className="rounded-lg border border-l-4 border-danger/50 border-l-danger bg-bg-secondary p-4 font-mono text-sm text-danger">
                <div className="mb-2 font-bold">Mermaid Syntax Error:</div>
                <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div className="flex min-h-[100px] min-w-50 animate-pulse items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                    Rendering chart...
                </span>
            </div>
        );
    }

    return (
        <div
            className="mermaid-chart-container inline-block select-none"
            // react-doctor-disable-next-line react-doctor/no-danger -- SVG string from mermaid.render is DOMPurify-sanitized (svg profile) at the sink; there is no non-dangerouslySetInnerHTML way to mount a generated SVG string.
            dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(svgContent, {
                    USE_PROFILES: { svg: true, svgFilters: true },
                }),
            }}
            ref={containerRef}
        />
    );
};

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

const touchDistance = (touches: TouchList): number => {
    const [a, b] = [touches[0], touches[1]];
    if (!a || !b) return 0;
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
};

const touchMidpoint = (touches: TouchList): { x: number; y: number } => {
    const [a, b] = [touches[0], touches[1]];
    if (!a || !b) return { x: 0, y: 0 };
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
};

const MermaidChartViewer = ({ content }: MermaidChartProps) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);
    const hasAutoFitRef = useRef(false);

    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);
    useLayoutEffect((): void => {
        zoomRef.current = zoom;
        panRef.current = pan;
    });

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const pinchRef = useRef<{
        startDistance: number;
        startZoom: number;
        startPan: { x: number; y: number };
        anchor: { x: number; y: number };
    } | null>(null);

    const zoomIn = (): void => {
        setZoom((z) =>
            clamp(Math.round((z + ZOOM_STEP) * 100) / 100, MIN_ZOOM, MAX_ZOOM),
        );
    };
    const zoomOut = (): void => {
        setZoom((z) =>
            clamp(Math.round((z - ZOOM_STEP) * 100) / 100, MIN_ZOOM, MAX_ZOOM),
        );
    };
    const resetView = (): void => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleRendered = useCallback(
        (size: { width: number; height: number }): void => {
            if (hasAutoFitRef.current) return;
            hasAutoFitRef.current = true;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const margin = 0.9;
            const fitZoom =
                (Math.min(
                    canvas.clientWidth / size.width,
                    canvas.clientHeight / size.height,
                ) || 1) * margin;

            setZoom(clamp(Math.round(fitZoom * 100) / 100, MIN_ZOOM, MAX_ZOOM));
        },
        [],
    );

    const zoomAround = (
        point: { x: number; y: number },
        nextZoom: number,
        baseZoom: number,
        basePan: { x: number; y: number },
    ): void => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dx = point.x - rect.left - rect.width / 2;
        const dy = point.y - rect.top - rect.height / 2;
        const ratio = nextZoom / baseZoom;

        setZoom(nextZoom);
        setPan({
            x: dx * (1 - ratio) + basePan.x * ratio,
            y: dy * (1 - ratio) + basePan.y * ratio,
        });
    };

    const handleMouseDown = (e: ReactMouseEvent): void => {
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y,
        };
    };

    useEffect((): (() => void) => {
        const handleMouseMove = (e: MouseEvent): void => {
            if (!isDraggingRef.current) return;
            setPan({
                x:
                    dragStartRef.current.panX +
                    (e.clientX - dragStartRef.current.x),
                y:
                    dragStartRef.current.panY +
                    (e.clientY - dragStartRef.current.y),
            });
        };
        const handleMouseUp = (): void => {
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return (): void => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect((): (() => void) | undefined => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const handleWheel = (e: WheelEvent): void => {
            e.preventDefault();
            const factor = Math.exp(-e.deltaY * 0.001);
            const nextZoom = clamp(
                Math.round(zoomRef.current * factor * 100) / 100,
                MIN_ZOOM,
                MAX_ZOOM,
            );
            zoomAround(
                { x: e.clientX, y: e.clientY },
                nextZoom,
                zoomRef.current,
                panRef.current,
            );
        };

        const handleTouchStart = (e: TouchEvent): void => {
            if (e.touches.length === 1) {
                pinchRef.current = null;
                isDraggingRef.current = true;
                const touch = e.touches[0];
                if (!touch) return;
                dragStartRef.current = {
                    x: touch.clientX,
                    y: touch.clientY,
                    panX: panRef.current.x,
                    panY: panRef.current.y,
                };
            } else if (e.touches.length === 2) {
                isDraggingRef.current = false;
                pinchRef.current = {
                    startDistance: touchDistance(e.touches),
                    startZoom: zoomRef.current,
                    startPan: panRef.current,
                    anchor: touchMidpoint(e.touches),
                };
            }
        };

        const handleTouchMove = (e: TouchEvent): void => {
            if (e.touches.length === 2 && pinchRef.current) {
                e.preventDefault();
                const { startDistance, startZoom, startPan, anchor } =
                    pinchRef.current;
                if (startDistance <= 0) return;
                const ratio = touchDistance(e.touches) / startDistance;
                const nextZoom = clamp(
                    Math.round(startZoom * ratio * 100) / 100,
                    MIN_ZOOM,
                    MAX_ZOOM,
                );
                zoomAround(anchor, nextZoom, startZoom, startPan);
            } else if (e.touches.length === 1 && isDraggingRef.current) {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch) return;
                setPan({
                    x:
                        dragStartRef.current.panX +
                        (touch.clientX - dragStartRef.current.x),
                    y:
                        dragStartRef.current.panY +
                        (touch.clientY - dragStartRef.current.y),
                });
            }
        };

        const handleTouchEnd = (e: TouchEvent): void => {
            isDraggingRef.current = false;
            pinchRef.current = null;
            // Dropping from two touches to one resumes as a drag.
            if (e.touches.length === 1) {
                handleTouchStart(e);
            }
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('touchstart', handleTouchStart, {
            passive: false,
        });
        window.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);

        return (): void => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, []);

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border-subtle bg-bg-subtle px-4 py-2">
                <Button
                    aria-label="Zoom out"
                    disabled={zoom <= MIN_ZOOM}
                    size="sm"
                    variant="ghost"
                    onClick={zoomOut}
                >
                    <ZoomOut size={16} />
                </Button>
                <span className="min-w-14 text-center text-xs font-medium text-muted-foreground">
                    {Math.round(zoom * 100)}%
                </span>
                <Button
                    aria-label="Zoom in"
                    disabled={zoom >= MAX_ZOOM}
                    size="sm"
                    variant="ghost"
                    onClick={zoomIn}
                >
                    <ZoomIn size={16} />
                </Button>
                <Button
                    aria-label="Reset view"
                    className="ml-1"
                    size="sm"
                    variant="ghost"
                    onClick={resetView}
                >
                    <RotateCcw size={16} />
                </Button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- drag-to-pan surface, not a discrete control; there's no native element for a pan/zoom canvas and panning has no meaningful keyboard equivalent beyond the zoom buttons already provided above */}
            <div
                className="flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
                data-testid="mermaid-canvas"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
            >
                <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <MermaidChartRenderer
                        content={content}
                        onRendered={handleRendered}
                    />
                </div>
            </div>
        </div>
    );
};

export const MermaidChart = ({ content }: MermaidChartProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="group my-2 inline-flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-3 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-bg-secondary/80"
                type="button"
                onClick={(): void => {
                    setIsOpen(true);
                }}
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Workflow size={18} />
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-foreground">
                        Mermaid diagram
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Click to view chart
                    </span>
                </span>
            </button>

            <Modal
                fullScreen
                noPadding
                isOpen={isOpen}
                title="Mermaid Diagram"
                onClose={(): void => {
                    setIsOpen(false);
                }}
            >
                {isOpen ? <MermaidChartViewer content={content} /> : null}
            </Modal>
        </>
    );
};
