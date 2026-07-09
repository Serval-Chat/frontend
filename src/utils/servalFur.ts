interface Spot {
    x: number;
    y: number;
    rx: number;
    ry: number;
    rot: number;
    rough: number;
    alpha: number;
    nPts: number;
}

function drawSpot(
    ctx: CanvasRenderingContext2D,
    s: Spot,
    spotColor: string,
    random: () => number,
): void {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    const pts = [];
    for (let i = 0; i < s.nPts; i++) {
        const angle = (i / s.nPts) * Math.PI * 2;
        const jitter = 1 + (random() - 0.5) * s.rough;
        pts.push({
            x: Math.cos(angle) * s.rx * jitter,
            y: Math.sin(angle) * s.ry * jitter,
        });
    }

    ctx.beginPath();
    // pts has exactly s.nPts elements (built by the loop above), and nPts is
    // always >= 6 (see nPts generation in applyServalBackground), so indices
    // 0 and nPts-1 are always in bounds.
    const pPrev = pts[s.nPts - 1]!;
    const pFirst = pts[0]!;
    ctx.moveTo((pPrev.x + pFirst.x) / 2, (pPrev.y + pFirst.y) / 2);

    for (let i = 0; i < s.nPts; i++) {
        // i and (i + 1) % s.nPts are both in [0, s.nPts), matching pts.length.
        const pCurr = pts[i]!;
        const pNext = pts[(i + 1) % s.nPts]!;
        const midX = (pCurr.x + pNext.x) / 2;
        const midY = (pCurr.y + pNext.y) / 2;
        ctx.quadraticCurveTo(pCurr.x, pCurr.y, midX, midY);
    }
    ctx.closePath();
    ctx.fillStyle = spotColor;
    ctx.globalAlpha = s.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

function createRandom(seed = 1): () => number {
    let state = seed >>> 0;
    return (): number => {
        state = (state * 1_664_525 + 1_013_904_223) >>> 0;
        return state / 0x1_00_00_00_00;
    };
}

function relaxSpots(
    spots: Spot[],
    w: number,
    h: number,
    iterations = 120,
): void {
    for (let iter = 0; iter < iterations; iter++) {
        const step = 8 * (1 - iter / iterations) + 0.3;

        for (let i = 0; i < spots.length; i++) {
            let fx = 0;
            let fy = 0;

            for (let j = 0; j < spots.length; j++) {
                if (i === j) continue;

                // i and j both range over [0, spots.length), so indexing is
                // always in bounds.
                const si = spots[i]!;
                const sj = spots[j]!;

                let dx = si.x - sj.x;
                let dy = si.y - sj.y;
                if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w;
                if (Math.abs(dy) > h / 2) dy -= Math.sign(dy) * h;

                const distSq = dx * dx + dy * dy + 1;
                const dist = Math.sqrt(distSq);

                const charge = (si.rx + sj.rx) * 60;
                const force = charge / distSq;

                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            }

            const si = spots[i]!;
            si.x = (((si.x + fx * step) % w) + w) % w;
            si.y = (((si.y + fy * step) % h) + h) % h;
        }
    }
}

interface ServalOptions {
    base?: string;
    opacity?: number;
    spotColor?: string;
    spotCount?: number;
    seed?: number;
}

export function applyServalBackground(
    element: HTMLElement,
    opts: ServalOptions = {},
): () => void {
    const {
        base = '#e8d5b0',
        opacity = 0.1,
        spotColor = 'rgb(40,22,5)',
        seed = 1,
    } = opts;
    const random = createRandom(seed);

    const bounds = element.getBoundingClientRect();
    const virtualW = Math.min(
        1920,
        Math.max(640, Math.ceil(bounds.width || window.innerWidth || 640)),
    );
    const virtualH = Math.min(
        1440,
        Math.max(480, Math.ceil(bounds.height || window.innerHeight || 480)),
    );

    const n =
        opts.spotCount ??
        Math.min(260, Math.max(24, Math.round((virtualW * virtualH) / 16_000)));

    const spots: Spot[] = Array.from({ length: n }, () => {
        const rx = 7 + random() * 14;
        return {
            x: random() * virtualW,
            y: random() * virtualH,
            rx,
            ry: rx * (0.45 + random() * 0.65),
            rot: random() * Math.PI,
            rough: 0.35 + random() * 0.45,
            alpha: (0.65 + random() * 0.7) * opacity,
            nPts: 6 + Math.floor(random() * 5),
        };
    });

    relaxSpots(spots, virtualW, virtualH, 36);

    const canvas = document.createElement('canvas');

    const canvasW = virtualW;
    const canvasH = virtualH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${canvasW}px`,
        height: `${canvasH}px`,
        pointerEvents: 'none',
        zIndex: '0',
    });

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvasW, canvasH);

    for (const s of spots) {
        drawSpot(ctx, s, spotColor, random);
    }

    const prevPosition = element.style.position;
    const prevOverflow = element.style.overflow;

    if (!element.style.position || element.style.position === 'static') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';
    element.insertBefore(canvas, element.firstChild);

    return (): void => {
        canvas.remove();
        element.style.position = prevPosition;
        element.style.overflow = prevOverflow;
    };
}
