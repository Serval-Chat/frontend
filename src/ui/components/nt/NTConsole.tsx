import React, {
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react';

import {
    type ConsoleProgram,
    DosFileSystem,
    Terminal,
    registry,
} from '@/console';
import { parseAnsi } from '@/console/utils/ansiParser';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleConsole } from '@/store/slices/debugOptionsSlice';
import { NTScrollArea } from '@/ui/components/nt/NTScrollArea';
import { Window } from '@/ui/components/nt/Window';
import { mergeReducer } from '@/utils/mergeReducer';

const MEASURE_COLUMNS = 80;
const SIZE_GUARD_PX = 1;

/** keeps the terminal's column/row size in sync with the console element size. */
const useNtTerminalAutosize = (
    isOpen: boolean,
    terminal: Terminal,
    consoleRef: React.RefObject<HTMLDivElement | null>,
    measureRef: React.RefObject<HTMLSpanElement | null>,
    activeProgramRef: React.RefObject<ConsoleProgram | null>,
): void => {
    useEffect((): (() => void) | undefined => {
        if (!isOpen || !consoleRef.current) return;

        const updateTerminalSize = (): void => {
            const viewport = consoleRef.current?.querySelector(
                '.nt-scroll-area__viewport',
            );
            const element =
                viewport instanceof HTMLElement ? viewport : consoleRef.current;
            const measure = measureRef.current;
            if (!element || !measure) return;

            const style = globalThis.getComputedStyle(element);
            const horizontalPadding =
                Number.parseFloat(style.paddingLeft) +
                Number.parseFloat(style.paddingRight);
            const verticalPadding =
                Number.parseFloat(style.paddingTop) +
                Number.parseFloat(style.paddingBottom);
            const measureRect = measure.getBoundingClientRect();
            const charWidth = measureRect.width / MEASURE_COLUMNS;
            const lineHeight = measureRect.height;
            if (charWidth <= 0 || lineHeight <= 0) return;

            const columns = Math.max(
                1,
                Math.floor(
                    (element.clientWidth - horizontalPadding - SIZE_GUARD_PX) /
                        charWidth,
                ),
            );
            const rows = Math.max(
                1,
                Math.floor(
                    (element.clientHeight - verticalPadding - SIZE_GUARD_PX) /
                        lineHeight,
                ),
            );

            const previous = terminal.getSize();
            terminal.setSize({ columns, rows });
            if (
                activeProgramRef.current &&
                (previous.columns !== columns || previous.rows !== rows)
            ) {
                activeProgramRef.current.start();
            }
        };

        updateTerminalSize();
        const resizeObserver = new ResizeObserver(updateTerminalSize);
        resizeObserver.observe(consoleRef.current);
        if (measureRef.current) {
            resizeObserver.observe(measureRef.current);
        }
        return (): void => {
            resizeObserver.disconnect();
        };
    }, [isOpen, terminal, consoleRef, measureRef, activeProgramRef]);
};

export const NTConsole = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(
        (state): boolean => state.debugOptions.isConsoleOpen,
    );
    const [terminal] = useState(
        (): Terminal =>
            new Terminal({
                initialLines: [
                    'Serchat(R) Console NT(TM)',
                    '(C) Copyright 1985-1996 Serchat Corp.',
                    '',
                ],
            }),
    );
    const [filesystem] = useState((): DosFileSystem => new DosFileSystem());

    interface ConsoleState {
        history: ReturnType<Terminal['snapshot']>;
        currentInput: string;
        isCommandRunning: boolean;
        activeProgram: ConsoleProgram | null;
        cwd: string;
    }
    const [state, patch] = useReducer(mergeReducer<ConsoleState>, {
        history: terminal.snapshot(),
        currentInput: '',
        isCommandRunning: false,
        activeProgram: null,
        cwd: filesystem.getCwd(),
    });
    const { history, currentInput, isCommandRunning, activeProgram, cwd } =
        state;
    type Snapshot = ReturnType<Terminal['snapshot']>;
    const setHistory = useCallback(
        (v: Snapshot | ((prev: Snapshot) => Snapshot)): void => {
            patch(
                typeof v === 'function'
                    ? (s): Partial<ConsoleState> => ({ history: v(s.history) })
                    : { history: v },
            );
        },
        [],
    );
    const setCurrentInput = (v: string): void => {
        patch({ currentInput: v });
    };
    const setIsCommandRunning = (v: boolean): void => {
        patch({ isCommandRunning: v });
    };
    const setActiveProgram = (v: ConsoleProgram | null): void => {
        patch({ activeProgram: v });
    };
    const setCwd = (v: string): void => {
        patch({ cwd: v });
    };
    const commandHistoryRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const activeProgramRef = useRef<ConsoleProgram | null>(null);

    const consoleRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    useEffect((): void => {
        terminal.attach(setHistory);
    }, [terminal, setHistory]);

    useEffect((): void => {
        activeProgramRef.current = activeProgram;
    }, [activeProgram]);

    useEffect((): (() => void) | undefined => {
        if (isOpen) {
            const timer = setTimeout((): void => {
                inputRef.current?.focus();
            }, 50);
            return (): void => {
                clearTimeout(timer);
            };
        }
    }, [isOpen]);

    useEffect((): (() => void) | undefined => {
        if (!isOpen) return;

        const handleFocus = (): void => {
            if (
                document.activeElement !== inputRef.current &&
                (!isCommandRunning || activeProgramRef.current)
            ) {
                inputRef.current?.focus();
            }
        };

        const interval = setInterval(handleFocus, 100);
        return (): void => {
            clearInterval(interval);
        };
    }, [isOpen, isCommandRunning]);

    useNtTerminalAutosize(
        isOpen,
        terminal,
        consoleRef,
        measureRef,
        activeProgramRef,
    );

    useEffect((): void => {
        const viewport = consoleRef.current?.querySelector(
            '.nt-scroll-area__viewport',
        );
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [history]);

    const handleConsoleClick = (): void => {
        const selection = globalThis.getSelection();
        if (!selection || selection.toString() === '') {
            inputRef.current?.focus();
        }
    };

    const executeCommand = (input: string): void => {
        const command = input.trim();
        const fullPromptLine = `${filesystem.getCwd()}>${input}`;

        if (!command) {
            terminal.puts(fullPromptLine);
            terminal.puts();
            return;
        }

        commandHistoryRef.current = [...commandHistoryRef.current, input];
        historyIndexRef.current = -1;
        setIsCommandRunning(true);

        void (async (): Promise<void> => {
            terminal.puts(fullPromptLine);
            await new Promise(
                (resolve): NodeJS.Timeout => setTimeout(resolve, 100),
            );

            const result = await registry.execute(input, {
                dispatch,
                endProgram: (): void => {
                    activeProgramRef.current = null;
                    setActiveProgram(null);
                },
                filesystem,
                startProgram: (program): void => {
                    activeProgramRef.current = program;
                    setActiveProgram(program);
                    program.start();
                },
                terminal,
                writeLine: (line: string): void => {
                    terminal.puts(line);
                },
                clearScreen: (): void => {
                    terminal.clear();
                },
            });

            if (result.clear) {
                terminal.clear();
            } else if (result.output) {
                terminal.writeLines(result.output);
            }

            setCwd(filesystem.getCwd());
            setIsCommandRunning(false);
        })();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (activeProgramRef.current) {
            activeProgramRef.current.handleKeyDown({
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                key: e.key,
                preventDefault: (): void => {
                    e.preventDefault();
                },
            });
            return;
        }

        if (isCommandRunning) {
            e.preventDefault();
            return;
        }

        switch (e.key) {
            case 'Enter': {
                executeCommand(currentInput);
                setCurrentInput('');

                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                if (commandHistoryRef.current.length === 0) return;

                const newIndex =
                    historyIndexRef.current === -1
                        ? commandHistoryRef.current.length - 1
                        : Math.max(0, historyIndexRef.current - 1);

                historyIndexRef.current = newIndex;
                setCurrentInput(commandHistoryRef.current[newIndex] ?? '');

                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                if (historyIndexRef.current === -1) return;

                const newIndex = historyIndexRef.current + 1;
                if (newIndex >= commandHistoryRef.current.length) {
                    historyIndexRef.current = -1;
                    setCurrentInput('');
                } else {
                    historyIndexRef.current = newIndex;
                    setCurrentInput(
                        commandHistoryRef.current[newIndex] ?? '',
                    );
                }

                break;
            }
            // no default
        }
    };

    if (!isOpen) return null;

    return (
        <Window
            defaultHeight={350}
            defaultWidth={600}
            defaultX={120}
            defaultY={120}
            icon="/icons/retro/chip.png"
            title="Command Prompt"
            onClose={(): {
                payload: undefined;
                type: 'debugOptions/toggleConsole';
            } => dispatch(toggleConsole())}
        >
            {/* false positive: can't be a real <button> - it wraps the terminal's
            actual <input> below, and interactive content (an input) isn't allowed
            inside a native <button> per the HTML spec. */}
            {/* react-doctor-disable-next-line react-doctor/prefer-tag-over-role */}
            <div
                aria-label="Terminal console"
                className="flex min-h-0 flex-1 flex-col bg-black font-mono text-[11px] leading-[13px] text-[#c0c0c0]"
                ref={consoleRef}
                role="button"
                tabIndex={0}
                onClick={handleConsoleClick}
                onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ')
                        handleConsoleClick();
                }}
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none invisible absolute whitespace-pre"
                    ref={measureRef}
                >
                    {'M'.repeat(MEASURE_COLUMNS)}
                </span>
                <NTScrollArea
                    className="min-h-0 w-full flex-1"
                    viewportClassName="p-2"
                >
                    <style>{`
                        @keyframes nt-blink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                        .nt-cursor {
                            display: inline-block;
                            width: 6px;
                            height: 11px;
                            background-color: #c0c0c0;
                            animation: nt-blink 1s step-end infinite;
                            vertical-align: middle;
                            margin-left: 2px;
                        }
                    `}</style>

                    {history.map((line) => (
                        <div
                            className="min-h-[1.1rem] whitespace-pre-wrap select-text"
                            key={line.id}
                        >
                            {parseAnsi(line.text)}
                        </div>
                    ))}

                    {!isCommandRunning && !activeProgram ? (
                        <div className="flex flex-wrap items-center select-none">
                            <span>{cwd}&gt;</span>
                            <span className="whitespace-pre select-text">
                                {currentInput}
                            </span>
                            <span className="nt-cursor" />
                        </div>
                    ) : null}

                    <input
                        aria-label="Terminal input"
                        className="pointer-events-none absolute h-0 w-0 opacity-0"
                        disabled={isCommandRunning}
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e): void => {
                            setCurrentInput(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                </NTScrollArea>
            </div>
        </Window>
    );
};
