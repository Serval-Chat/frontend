import type { DosFileSystem } from '@/console/DosFileSystem';
import type { Terminal } from '@/console/Terminal';
import type { AppDispatch } from '@/store';

export interface ConsoleKeyEvent {
    altKey: boolean;
    ctrlKey: boolean;
    key: string;
    preventDefault: () => void;
}

export interface ConsoleProgram {
    handleKeyDown: (event: ConsoleKeyEvent) => void;
    start: () => void;
}

export interface CommandContext {
    dispatch: AppDispatch;
    endProgram?: () => void;
    filesystem?: DosFileSystem;
    startProgram?: (program: ConsoleProgram) => void;
    terminal?: Terminal;
    writeLine?: (text: string) => void;
    clearScreen?: () => void;
}

export interface CommandResult {
    output?: string[];
    clear?: boolean;
    mutateTo?: string;
}

export interface ConCommandReactor {
    match: (argc: number, argv: string[]) => boolean;
    execute: (
        argc: number,
        argv: string[],
        context: CommandContext,
    ) => CommandResult | Promise<CommandResult>;
    default?: (
        argc: number,
        argv: string[],
        context: CommandContext,
    ) => CommandResult | Promise<CommandResult>;
}

export class ConCommandRegistry {
    private reactors: ConCommandReactor[] = [];

    public register(reactor: ConCommandReactor): void {
        if (reactor.default) {
            const hasDefault = this.reactors.some(
                (r): boolean => r.default !== undefined,
            );
            if (hasDefault) {
                throw new Error(
                    'ConCommandRegistry: Max one reactor with a default handler is allowed.',
                );
            }
        }
        this.reactors.push(reactor);
    }

    public async execute(
        input: string,
        context: CommandContext,
    ): Promise<CommandResult> {
        let currentInput = input.trim();
        let depth = 0;
        const maxDepth = 5;
        let cumulativeOutput: string[] = [];

        while (currentInput && depth < maxDepth) {
            const argv = currentInput.split(' ').filter(Boolean);
            const argc = argv.length;
            if (argc === 0) {
                break;
            }

            let handled = false;
            let result: CommandResult = {};

            for (const reactor of this.reactors) {
                if (reactor.match(argc, argv)) {
                    result = await reactor.execute(argc, argv, context);
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                const defaultReactor = this.reactors.find(
                    (r): boolean => r.default !== undefined,
                );
                if (defaultReactor && defaultReactor.default) {
                    result = await defaultReactor.default(argc, argv, context);
                    handled = true;
                }
            }

            if (!handled) {
                return {
                    output: [
                        ...cumulativeOutput,
                        `'${argv[0]}' is not recognized as an internal or external command,`,
                        'operable program or batch file.',
                    ],
                };
            }

            if (result.output) {
                cumulativeOutput = [...cumulativeOutput, ...result.output];
            }

            if (result.clear) {
                return { clear: true };
            }

            if (result.mutateTo) {
                currentInput = result.mutateTo.trim();
                depth++;
            } else {
                return {
                    output:
                        cumulativeOutput.length > 0
                            ? cumulativeOutput
                            : undefined,
                };
            }
        }

        if (depth >= maxDepth) {
            return {
                output: [
                    ...cumulativeOutput,
                    'Error: Maximum command mutation depth exceeded.',
                ],
            };
        }

        return {
            output: cumulativeOutput.length > 0 ? cumulativeOutput : undefined,
        };
    }
}
