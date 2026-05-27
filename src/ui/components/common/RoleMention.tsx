import React from 'react';

import { AtSign } from 'lucide-react';

import { useRoles } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';
import type { TextProps } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { getReadableRoleTextStyleAt, getRoleStyle } from '@/utils/roleColor';

interface RoleMentionProps {
    roleId: string;
    size?: TextProps['size'];
}

interface SegmenterLike {
    segment(value: string): Iterable<{ segment: string }>;
}

interface GlyphSegment {
    glyph: string;
    key: string;
    order: number;
}

const splitGraphemes = (value: string): string[] => {
    const Segmenter = (
        Intl as typeof Intl & {
            Segmenter?: new (
                locale: string,
                options: { granularity: 'grapheme' },
            ) => SegmenterLike;
        }
    ).Segmenter;

    if (!Segmenter) return Array.from(value);

    return Array.from(
        new Segmenter('en', { granularity: 'grapheme' }).segment(value),
        ({ segment }) => segment,
    );
};

const measureText = (
    canvas: HTMLCanvasElement,
    font: string,
    value: string,
): number => {
    const context = canvas.getContext('2d');

    if (!context) return 0;

    context.font = font;

    return context.measureText(value).width;
};

const getFallbackGlyphPositions = (glyphs: string[]): number[] =>
    glyphs.map((_, index) => (index + 0.5) / Math.max(glyphs.length, 1));

const getGlyphSegments = (value: string): GlyphSegment[] => {
    const counts = new Map<string, number>();

    return splitGraphemes(value).map((glyph, order) => {
        const count = counts.get(glyph) ?? 0;
        counts.set(glyph, count + 1);

        return {
            glyph,
            key: `${glyph}-${count}`,
            order,
        };
    });
};

const roleMentionTextSize: Partial<
    Record<NonNullable<TextProps['size']>, string>
> = {
    '2xs': 'text-[10px]',
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
};

const roleMentionIconSize: Partial<
    Record<NonNullable<TextProps['size']>, number>
> = {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
};

/**
 * @description Renders a role mention with per-glyph contrast over role colors.
 */
export const RoleMention: React.FC<RoleMentionProps> = ({
    roleId,
    size = 'sm',
}) => {
    const rootRef = React.useRef<HTMLElement | null>(null);
    const iconRef = React.useRef<SVGSVGElement | null>(null);
    const textRef = React.useRef<HTMLElement | null>(null);
    const measureCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const { data: roles, isLoading } = useRoles(selectedServerId, {
        enabled: !!selectedServerId,
    });

    const role = roles?.find((r) => r._id === roleId);

    const roleName = role ? role.name : isLoading ? '...' : 'unknown-role';

    const style = getRoleStyle(role);
    const glyphSegments = React.useMemo(
        () => getGlyphSegments(roleName),
        [roleName],
    );
    const glyphs = React.useMemo(
        () => glyphSegments.map(({ glyph }) => glyph),
        [glyphSegments],
    );
    const [glyphPositions, setGlyphPositions] = React.useState<number[]>(() =>
        getFallbackGlyphPositions(glyphs),
    );
    const [iconPosition, setIconPosition] = React.useState(0.08);

    React.useLayoutEffect(() => {
        const rootElement = rootRef.current;
        const iconElement = iconRef.current;
        const textElement = textRef.current;

        if (!rootElement || !textElement) {
            setGlyphPositions(getFallbackGlyphPositions(glyphs));
            return undefined;
        }

        const updateGlyphPositions = (): void => {
            const rootRect = rootElement.getBoundingClientRect();
            const iconRect = iconElement?.getBoundingClientRect();
            const textRect = textElement.getBoundingClientRect();

            if (rootRect.width <= 0) {
                setGlyphPositions(getFallbackGlyphPositions(glyphs));
                return;
            }

            const computedStyle = window.getComputedStyle(textElement);
            const canvas =
                measureCanvasRef.current ??
                (measureCanvasRef.current = document.createElement('canvas'));
            let textOffset = 0;

            const nextPositions = glyphs.map((glyph) => {
                const glyphWidth = measureText(
                    canvas,
                    computedStyle.font,
                    glyph,
                );
                const centerX =
                    textRect.left - rootRect.left + textOffset + glyphWidth / 2;

                textOffset += glyphWidth;

                return centerX / rootRect.width;
            });

            setGlyphPositions(nextPositions);

            if (iconRect) {
                setIconPosition(
                    (iconRect.left - rootRect.left + iconRect.width / 2) /
                        rootRect.width,
                );
            }
        };

        updateGlyphPositions();

        if (!window.ResizeObserver) return undefined;

        const observer = new ResizeObserver(updateGlyphPositions);
        observer.observe(rootElement);
        observer.observe(textElement);

        return () => observer.disconnect();
    }, [glyphs]);

    const glyphTextStyles = React.useMemo(
        () =>
            glyphs.map((_, index) =>
                getReadableRoleTextStyleAt(
                    role,
                    glyphPositions[index] ?? (index + 0.5) / glyphs.length,
                ),
            ),
        [glyphPositions, glyphs, role],
    );
    const iconTextStyle = React.useMemo(
        () => getReadableRoleTextStyleAt(role, iconPosition),
        [iconPosition, role],
    );
    const normalizedSize = size ?? 'sm';

    return (
        <Box
            as="span"
            className="inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-px font-medium whitespace-nowrap shadow-sm transition-opacity select-none hover:opacity-90"
            ref={rootRef}
            style={style}
        >
            <AtSign
                className="shrink-0"
                ref={iconRef}
                size={
                    roleMentionIconSize[normalizedSize] ??
                    roleMentionIconSize.sm
                }
                style={iconTextStyle}
            />
            <span
                className={cn(
                    'flex items-center leading-normal',
                    roleMentionTextSize[normalizedSize] ??
                        roleMentionTextSize.sm,
                )}
                ref={textRef}
            >
                {glyphSegments.map(({ glyph, key, order }) => (
                    <span
                        aria-hidden="true"
                        key={key}
                        style={glyphTextStyles[order]}
                    >
                        {glyph}
                    </span>
                ))}
                <span className="sr-only">{roleName}</span>
            </span>
        </Box>
    );
};
