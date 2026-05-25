import type { ConCommandReactor } from '@/console/ConCommandRegistry';

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

let gameState: GameState | null = null;
let gameInterval: NodeJS.Timeout | null = null;
let keyListener: ((e: KeyboardEvent) => void) | null = null;
let frameCount = 0;

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

const renderGame = (state: GameState): string => {
    let output = '\x1b[1;32mSnek Game\x1b[0m\n';
    output += '\x1b[1;36m' + '='.repeat(BOARD_WIDTH) + '\x1b[0m\n';
    output += `\x1b[1;33mScore: ${state.score}\x1b[0m\n\n`;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const isSnake = state.snake.some((s) => s.x === x && s.y === y);
            const isFood = state.food.x === x && state.food.y === y;
            const isHead = state.snake[0]?.x === x && state.snake[0]?.y === y;

            if (isHead) {
                output += '\x1b[1;32m@\x1b[0m';
            } else if (isSnake) {
                output += '\x1b[32mo\x1b[0m';
            } else if (isFood) {
                output += '\x1b[1;31m*\x1b[0m';
            } else {
                const hue =
                    (Math.sin(x * 0.4 + frameCount * 0.12) +
                        Math.sin(y * 0.6 + frameCount * 0.09) +
                        Math.sin((x + y) * 0.3 - frameCount * 0.07)) *
                        60 +
                    180;
                const [r, g, b] = hueToRgb(hue);
                output += `\x1b[38;2;${r};${g};${b}m.\x1b[0m`;
            }
        }
        output += '\n';
    }

    output += '\n';
    output += '\x1b[1;36m' + '='.repeat(BOARD_WIDTH) + '\x1b[0m\n';
    output += '\x1b[1;37mArrow Keys: Move | Q: Quit\x1b[0m\n';

    if (state.gameOver) {
        output += '\n\x1b[1;31mGAME OVER!\x1b[0m\n';
        output += `\x1b[1;33mFinal Score: ${state.score}\x1b[0m\n`;
    }

    return output;
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
        // discard invalid (180°) inputs and try the next buffered one
    }

    const head = {
        x: state.snake[0].x + currentDirection.x,
        y: state.snake[0].y + currentDirection.y,
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

    if (state.snake.some((s) => s.x === head.x && s.y === head.y)) {
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
        } while (newSnake.some((s) => s.x === newFood.x && s.y === newFood.y));

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
const stopGame = (): void => {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    if (keyListener) {
        window.removeEventListener('keydown', keyListener);
        keyListener = null;
    }
};

export const snakeCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'snake',
    execute: async (_argc, _argv, context) => {
        if (!context.writeLine) {
            return {
                output: [
                    'Error: Console does not support interactive commands.',
                ],
            };
        }

        // Stop any existing game
        stopGame();

        gameState = initGame();
        frameCount = 0;
        context.writeLine(renderGame(gameState));

        // Set up key listener
        keyListener = (e: KeyboardEvent) => {
            if (!gameState || gameState.gameOver) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (gameState.directionBuffer.length < 3) {
                        const lastBuffered =
                            gameState.directionBuffer.length > 0
                                ? gameState.directionBuffer[
                                      gameState.directionBuffer.length - 1
                                  ]
                                : gameState.direction;
                        if (!(lastBuffered.x === 0 && lastBuffered.y === 1)) {
                            gameState.directionBuffer.push({ x: 0, y: -1 });
                        }
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (gameState.directionBuffer.length < 3) {
                        const lastBuffered =
                            gameState.directionBuffer.length > 0
                                ? gameState.directionBuffer[
                                      gameState.directionBuffer.length - 1
                                  ]
                                : gameState.direction;
                        if (!(lastBuffered.x === 0 && lastBuffered.y === -1)) {
                            gameState.directionBuffer.push({ x: 0, y: 1 });
                        }
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (gameState.directionBuffer.length < 3) {
                        const lastBuffered =
                            gameState.directionBuffer.length > 0
                                ? gameState.directionBuffer[
                                      gameState.directionBuffer.length - 1
                                  ]
                                : gameState.direction;
                        if (!(lastBuffered.x === 1 && lastBuffered.y === 0)) {
                            gameState.directionBuffer.push({ x: -1, y: 0 });
                        }
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (gameState.directionBuffer.length < 3) {
                        const lastBuffered =
                            gameState.directionBuffer.length > 0
                                ? gameState.directionBuffer[
                                      gameState.directionBuffer.length - 1
                                  ]
                                : gameState.direction;
                        if (!(lastBuffered.x === -1 && lastBuffered.y === 0)) {
                            gameState.directionBuffer.push({ x: 1, y: 0 });
                        }
                    }
                    break;
                case 'q':
                case 'Q':
                    stopGame();
                    gameState = null;
                    context.writeLine?.('\nGame exited.');
                    e.preventDefault();
                    break;
            }
        };

        window.addEventListener('keydown', keyListener);

        // Game loop
        gameInterval = setInterval(() => {
            if (!gameState) {
                stopGame();
                return;
            }

            if (gameState.gameOver) {
                stopGame();
                context.clearScreen?.();
                context.writeLine?.(renderGame(gameState));
                return;
            }

            frameCount++;
            gameState = moveSnake(gameState);
            context.clearScreen?.();
            context.writeLine?.(renderGame(gameState));
        }, GAME_SPEED);

        return {
            output: [
                'Starting Snake game... Use arrow keys to move, Q to quit.',
            ],
        };
    },
};
