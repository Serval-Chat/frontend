export interface SpringConfig {
    tension: number;
    friction: number;
    mass: number;
    threshold: number;
    clamp: boolean;
    maxVelocity: number;
}

const DEFAULT_SPRING_CONFIG: SpringConfig = {
    tension: 160,
    friction: 22,
    mass: 1,
    threshold: 0.001,
    clamp: false,
    maxVelocity: Infinity,
};

const FIXED_DT = 1 / 240;
const MAX_ACCUMULATOR = 2;

export type SpringWrite = (value: number, abort: () => void) => void;

interface SpringUpdate {
    vel: number;
    from: number;
    accel: number;
}

export class ScrollSpring {
    private readonly config: SpringConfig;
    private readonly write: SpringWrite;
    private from = 0;
    private target = 0;
    private vel = 0;
    private accumulator = 0;
    private last: number | null = null;
    private animating = false;
    private rafId: number | null = null;
    private callbacks: Array<() => void> = [];

    constructor(write: SpringWrite, config: Partial<SpringConfig> = {}) {
        this.write = write;
        this.config = { ...DEFAULT_SPRING_CONFIG, ...config };
    }

    private getUpdates(vel: number, pos: number): SpringUpdate {
        const { tension, friction, mass, maxVelocity } = this.config;
        const accel = (-tension * (pos - this.target) - friction * vel) / mass;
        let nextVel = vel + accel * FIXED_DT;
        if (Math.abs(nextVel) > maxVelocity) {
            nextVel = maxVelocity * Math.sign(nextVel);
        }
        return { vel: nextVel, from: pos + nextVel * FIXED_DT, accel };
    }

    private readonly abort = (): void => {
        this.stop(this.from);
    };

    private readonly update = (timestamp: number): void => {
        if (this.last === null) {
            this.last = timestamp;
            this.rafId = requestAnimationFrame(this.update);
            return;
        }

        this.accumulator = Math.min(
            (timestamp - this.last) / 1000 + this.accumulator,
            MAX_ACCUMULATOR,
        );
        this.last = timestamp;

        let prevFrom = this.from;
        while (this.accumulator > FIXED_DT) {
            this.accumulator -= FIXED_DT;
            const { vel, from, accel } = this.getUpdates(this.vel, this.from);
            this.vel = vel;

            const { clamp, threshold } = this.config;
            const crossedTarget =
                clamp &&
                (from === this.target ||
                    (from < this.target && prevFrom > this.target) ||
                    (from > this.target && prevFrom < this.target));

            if (crossedTarget || Math.abs(accel * FIXED_DT) < threshold) {
                this.stop(this.target);
                return;
            }

            prevFrom = this.from;
            this.from = from;
        }

        if (this.accumulator > 0) {
            const { from: interpolated } = this.getUpdates(this.vel, this.from);
            this.from +=
                (interpolated - this.from) * (this.accumulator / FIXED_DT);
        }

        this.write(this.from, this.abort);

        if (this.animating) {
            this.rafId = requestAnimationFrame(this.update);
        }
    };

    private stop(target: number): void {
        this.animating = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.last = null;
        this.accumulator = 0;
        this.from = target;
        this.target = target;
        this.vel = 0;
        this.write(this.from, this.abort);
        const pending = this.callbacks;
        this.callbacks = [];
        pending.forEach((cb): void => cb());
    }

    to({
        to,
        from,
        animate = true,
        callback,
    }: {
        to: number;
        from?: number;
        animate?: boolean;
        callback?: () => void;
    }): void {
        this.target = to;
        if (callback) this.callbacks.push(callback);
        if (from !== undefined) this.from = from;
        if (animate) {
            if (!this.animating) {
                this.animating = true;
                this.last = null;
                this.rafId = requestAnimationFrame(this.update);
            }
        } else {
            this.stop(to);
        }
    }

    mergeTo({ to, callback }: { to: number; callback?: () => void }): void {
        if (!this.animating) {
            if (callback) this.callbacks.push(callback);
            this.stop(to);
            return;
        }
        const delta = to - this.from;
        this.from = to;
        this.target += delta;
        this.write(this.from, this.abort);
        callback?.();
    }

    cancel(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.animating = false;
        this.last = null;
        this.accumulator = 0;
        this.vel = 0;
        this.target = this.from;
        this.callbacks = [];
    }

    isAnimating(): boolean {
        return this.animating;
    }

    destroy(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.animating = false;
        this.callbacks = [];
    }
}
