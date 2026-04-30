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
): void {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    const pts = [];
    for (let i = 0; i < s.nPts; i++) {
        const angle = (i / s.nPts) * Math.PI * 2;
        const jitter = 1 + (Math.random() - 0.5) * s.rough;
        pts.push({
            x: Math.cos(angle) * s.rx * jitter,
            y: Math.sin(angle) * s.ry * jitter,
        });
    }

    ctx.beginPath();
    const pPrev = pts[s.nPts - 1];
    const pFirst = pts[0];
    ctx.moveTo((pPrev.x + pFirst.x) / 2, (pPrev.y + pFirst.y) / 2);

    for (let i = 0; i < s.nPts; i++) {
        const pCurr = pts[i];
        const pNext = pts[(i + 1) % s.nPts];
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

                let dx = spots[i].x - spots[j].x;
                let dy = spots[i].y - spots[j].y;
                if (Math.abs(dx) > w / 2) dx -= Math.sign(dx) * w;
                if (Math.abs(dy) > h / 2) dy -= Math.sign(dy) * h;

                const distSq = dx * dx + dy * dy + 1;
                const dist = Math.sqrt(distSq);

                const charge = (spots[i].rx + spots[j].rx) * 60;
                const force = charge / distSq;

                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            }

            spots[i].x = (((spots[i].x + fx * step) % w) + w) % w;
            spots[i].y = (((spots[i].y + fy * step) % h) + h) % h;
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
    } = opts;

    const w = element.clientWidth || element.offsetWidth;
    const h = element.clientHeight || element.offsetHeight;
    if (w === 0 || h === 0) return () => {};

    const area = w * h;
    const n = opts.spotCount ?? Math.max(20, Math.round(area / 12000));

    const spots: Spot[] = Array.from({ length: n }, () => {
        const rx = 7 + Math.random() * 14;
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            rx,
            ry: rx * (0.45 + Math.random() * 0.65),
            rot: Math.random() * Math.PI,
            rough: 0.35 + Math.random() * 0.45,
            alpha: (0.65 + Math.random() * 0.7) * opacity,
            nPts: 6 + Math.floor(Math.random() * 5),
        };
    });

    relaxSpots(spots, w, h);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    Object.assign(canvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '0',
    });

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (const s of spots) {
        drawSpot(ctx, s, spotColor);
    }

    const prevPosition = element.style.position;
    if (!element.style.position || element.style.position === 'static') {
        element.style.position = 'relative';
    }
    element.insertBefore(canvas, element.firstChild);

    return () => {
        canvas.remove();
        element.style.position = prevPosition;
    };
}
