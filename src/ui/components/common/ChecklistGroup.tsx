import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { motion } from 'framer-motion';

import { cn } from '@/utils/cn';
import type { ChecklistNode } from '@/utils/textParser/types';

const INDENT_PX = 28;
const CHECKMARK_SPLINE = 'M 3 10 C 4.5 12 6 14.5 8 14 C 10 13.5 13 8 16 4';

export interface ChecklistGroupProps {
    nodes: ChecklistNode[];
    renderContent: (node: ChecklistNode) => React.ReactNode;
}

function buildPairs(nodes: ChecklistNode[]): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];
    const depthMap = new Map<number, number>();

    for (let i = 0; i < nodes.length; i++) {
        const d = nodes[i].depth ?? 0;
        const parentIdx = d > 0 ? depthMap.get(d - 1) : undefined;
        if (parentIdx !== undefined) pairs.push([parentIdx, i]);
        depthMap.set(d, i);
        const keys = Array.from(depthMap.keys());
        for (const k of keys) {
            if (k > d) depthMap.delete(k);
        }
    }

    return pairs;
}

const CORNER_R = 6;

function drawSplines(
    svg: SVGSVGElement,
    stage: HTMLElement,
    boxEls: Array<HTMLElement | null>,
    pairs: Array<[number, number]>,
): void {
    const sr = stage.getBoundingClientRect();
    const pathEls: SVGPathElement[] = [];

    for (const [pi, ci] of pairs) {
        const pb = boxEls[pi]?.getBoundingClientRect();
        const cb = boxEls[ci]?.getBoundingClientRect();
        if (!pb || !cb) continue;

        const fx = pb.left - sr.left + pb.width / 2;
        const fy = pb.bottom - sr.top;
        const tx = cb.left - sr.left;
        const ty = cb.top - sr.top + cb.height / 2;

        const dy = ty - fy;
        const dx = tx - fx;
        const r = Math.min(CORNER_R, dy, Math.max(0, dx));

        const d =
            r > 0
                ? `M ${fx} ${fy} L ${fx} ${ty - r} A ${r} ${r} 0 0 0 ${fx + r} ${ty} L ${tx} ${ty}`
                : `M ${fx} ${fy} L ${fx} ${ty} L ${tx} ${ty}`;

        const p = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
        );
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'var(--color-checklist-spine)');
        p.setAttribute('stroke-width', '1.5');
        p.setAttribute('stroke-linecap', 'round');
        pathEls.push(p);
    }

    svg.replaceChildren(...pathEls);
}

export const ChecklistGroup: React.FC<ChecklistGroupProps> = ({
    nodes,
    renderContent,
}) => {
    const stageRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const boxEls = useRef<Array<HTMLElement | null>>([]);

    const pairs = useMemo(() => buildPairs(nodes), [nodes]);

    const redraw = useCallback(() => {
        if (svgRef.current && stageRef.current) {
            drawSplines(
                svgRef.current,
                stageRef.current,
                boxEls.current,
                pairs,
            );
        }
    }, [pairs]);

    useLayoutEffect(() => {
        redraw();
        const stage = stageRef.current;
        if (!stage) return;
        const obs = new ResizeObserver(redraw);
        obs.observe(stage);
        return () => {
            obs.disconnect();
        };
    }, [redraw]);

    const setBoxRef = useCallback((idx: number, el: HTMLElement | null) => {
        boxEls.current[idx] = el;
    }, []);

    return (
        <div className="relative my-1" ref={stageRef}>
            <svg
                aria-hidden="true"
                ref={svgRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none',
                }}
            />

            {nodes.map((node, idx) => (
                <ChecklistRow
                    idx={idx}
                    key={`cl-${node.depth}-${node.checked}-${typeof node.content === 'string' ? node.content.slice(0, 20) : 'complex'}`}
                    node={node}
                    renderContent={renderContent}
                    setBoxRef={setBoxRef}
                />
            ))}
        </div>
    );
};

interface ChecklistRowProps {
    idx: number;
    node: ChecklistNode;
    setBoxRef: (idx: number, el: HTMLElement | null) => void;
    renderContent: (node: ChecklistNode) => React.ReactNode;
}

const ChecklistRow: React.FC<ChecklistRowProps> = ({
    idx,
    node,
    setBoxRef,
    renderContent,
}) => {
    const { checked, depth = 0 } = node;

    return (
        <div
            className="flex items-center gap-2.5 py-[3px]"
            style={{ paddingLeft: `${depth * INDENT_PX}px` }}
        >
            <div className="shrink-0" ref={(el) => setBoxRef(idx, el)}>
                <motion.div
                    animate={checked ? 'checked' : 'unchecked'}
                    className={cn(
                        'relative flex h-[15px] w-[15px] items-center justify-center rounded',
                        'transition-colors duration-200',
                        checked
                            ? 'bg-primary shadow-sm shadow-primary/40'
                            : 'border-border border bg-bg-subtle',
                    )}
                    initial={false}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    variants={{
                        checked: { scale: [1, 0.85, 1.05, 1] },
                        unchecked: { scale: 1 },
                    }}
                >
                    <svg
                        className="h-[11px] w-[11px] overflow-visible"
                        fill="none"
                        viewBox="0 0 18 18"
                    >
                        <motion.path
                            animate={{
                                pathLength: checked ? 1 : 0,
                                opacity: checked ? 1 : 0,
                            }}
                            d={CHECKMARK_SPLINE}
                            initial={{ pathLength: 0, opacity: 0 }}
                            stroke="white"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.1}
                            transition={{
                                pathLength: {
                                    duration: 0.32,
                                    ease: [0.34, 1.56, 0.64, 1],
                                },
                                opacity: { duration: 0.08 },
                            }}
                        />
                    </svg>
                </motion.div>
            </div>

            <span
                className={cn(
                    'flex-1 text-sm leading-snug transition-all duration-300',
                    checked
                        ? 'text-foreground-muted decoration-foreground-muted/50 line-through'
                        : 'text-foreground',
                )}
            >
                {renderContent(node)}
            </span>
        </div>
    );
};
