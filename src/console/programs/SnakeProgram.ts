import type {
    ConsoleKeyEvent,
    ConsoleProgram,
} from '@/console/ConCommandRegistry';
import type { Terminal } from '@/console/Terminal';

interface Position {
    x: number;
    y: number;
}

interface GameState {
    snake: Position[];
    food: Position;
    direction: Position;
    directionBuffer: Position[];
    score: number;
    gameOver: boolean;
}

const BOARD_WIDTH = 30;
const BOARD_HEIGHT = 15;
const GAME_SPEED = 150;

const initGame = (): GameState => ({
    snake: [{ x: 5, y: 5 }],
    food: { x: 15, y: 5 },
    direction: { x: 1, y: 0 },
    directionBuffer: [],
    score: 0,
    gameOver: false,
});

const hueToRgb = (h: number): [number, number, number] => {
    h = h % 360;
    const s = 1,
        l = 0.18;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;
    if (h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};

const moveSnake = (state: GameState): GameState => {
    if (state.gameOver) return state;

    const directionBuffer = [...state.directionBuffer];
    let currentDirection = state.direction;

    while (directionBuffer.length > 0) {
        const next = directionBuffer.shift()!;
        if (
            !(next.x === -currentDirection.x && next.y === currentDirection.y)
        ) {
            currentDirection = next;
            break;
        }
    }

    const currentHead = state.snake[0];
    if (!currentHead) {
        return state;
    }

    const head = {
        x: currentHead.x + currentDirection.x,
        y: currentHead.y + currentDirection.y,
    };

    if (
        head.x < 0 ||
        head.x >= BOARD_WIDTH ||
        head.y < 0 ||
        head.y >= BOARD_HEIGHT
    ) {
        return {
            ...state,
            direction: currentDirection,
            directionBuffer,
            gameOver: true,
        };
    }

    if (state.snake.some((s): boolean => s.x === head.x && s.y === head.y)) {
        return {
            ...state,
            direction: currentDirection,
            directionBuffer,
            gameOver: true,
        };
    }

    const newSnake = [head, ...state.snake];

    if (head.x === state.food.x && head.y === state.food.y) {
        let newFood: Position;
        do {
            newFood = {
                x: Math.floor(Math.random() * BOARD_WIDTH),
                y: Math.floor(Math.random() * BOARD_HEIGHT),
            };
        } while (
            newSnake.some(
                (s): boolean => s.x === newFood.x && s.y === newFood.y,
            )
        );

        return {
            ...state,
            snake: newSnake,
            food: newFood,
            score: state.score + 10,
            direction: currentDirection,
            directionBuffer,
        };
    }

    newSnake.pop();
    return {
        ...state,
        snake: newSnake,
        direction: currentDirection,
        directionBuffer,
    };
};

export class SnakeProgram implements ConsoleProgram {
    private readonly terminal: Terminal;
    private readonly onExit: () => void;
    private state: GameState = initGame();
    private frameCount = 0;
    private interval: NodeJS.Timeout | null = null;
    private started = false;

    public constructor(options: { terminal: Terminal; onExit: () => void }) {
        this.terminal = options.terminal;
        this.onExit = options.onExit;
    }

    public start(): void {
        if (this.started) {
            this.render();
            return;
        }
        this.started = true;

        this.state = initGame();
        this.frameCount = 0;
        this.render();

        this.interval = setInterval((): void => {
            this.frameCount++;
            this.state = moveSnake(this.state);
            this.render();
            if (this.state.gameOver) {
                this.stopLoop();
            }
        }, GAME_SPEED);
    }

    public handleKeyDown(event: ConsoleKeyEvent): void {
        if (event.key === 'q' || event.key === 'Q') {
            event.preventDefault();
            this.quit();
            return;
        }

        if (this.state.gameOver) return;

        switch (event.key) {
            case 'ArrowUp': {
                event.preventDefault();
                this.buffer({ x: 0, y: -1 }, { x: 0, y: 1 });
                break;
            }
            case 'ArrowDown': {
                event.preventDefault();
                this.buffer({ x: 0, y: 1 }, { x: 0, y: -1 });
                break;
            }
            case 'ArrowLeft': {
                event.preventDefault();
                this.buffer({ x: -1, y: 0 }, { x: 1, y: 0 });
                break;
            }
            case 'ArrowRight': {
                event.preventDefault();
                this.buffer({ x: 1, y: 0 }, { x: -1, y: 0 });
                break;
            }
            // no default
        }
    }

    private buffer(next: Position, opposite: Position): void {
        if (this.state.directionBuffer.length >= 3) return;
        const lastBuffered =
            this.state.directionBuffer.at(-1) ?? this.state.direction;
        if (lastBuffered.x === opposite.x && lastBuffered.y === opposite.y) {
            return;
        }
        this.state.directionBuffer.push(next);
    }

    private quit(): void {
        this.stopLoop();
        this.terminal.puts('Game exited.');
        this.onExit();
    }

    private stopLoop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private render(): void {
        this.terminal.clear();
        this.terminal.write(this.renderGame());
    }

    private renderGame(): string {
        const state = this.state;
        let output = '[1;32mSnek Game[0m\n';
        output += '[1;36m' + '='.repeat(BOARD_WIDTH) + '[0m\n';
        output += `[1;33mScore: ${state.score}[0m\n\n`;

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const isSnake = state.snake.some(
                    (s): boolean => s.x === x && s.y === y,
                );
                const isFood = state.food.x === x && state.food.y === y;
                const isHead =
                    state.snake[0]?.x === x && state.snake[0]?.y === y;

                if (isHead) {
                    output += '[1;32m@[0m';
                } else if (isSnake) {
                    output += '[32mo[0m';
                } else if (isFood) {
                    output += '[1;31m*[0m';
                } else {
                    const hue =
                        (Math.sin(x * 0.4 + this.frameCount * 0.12) +
                            Math.sin(y * 0.6 + this.frameCount * 0.09) +
                            Math.sin(
                                (x + y) * 0.3 - this.frameCount * 0.07,
                            )) *
                            60 +
                        180;
                    const [r, g, b] = hueToRgb(hue);
                    output += `[38;2;${r};${g};${b}m.[0m`;
                }
            }
            output += '\n';
        }

        output += '\n';
        output += '[1;36m' + '='.repeat(BOARD_WIDTH) + '[0m\n';
        output += '[1;37mArrow Keys: Move | Q: Quit[0m\n';

        if (state.gameOver) {
            output += '\n[1;31mGAME OVER![0m\n';
            output += `[1;33mFinal Score: ${state.score}[0m\n`;
        }

        return output;
    }
}
