import React, { useEffect, useRef, useState } from 'react';

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

const MEASURE_COLUMNS = 80;
const SIZE_GUARD_PX = 1;

export const NTConsole: React.FC = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.debugOptions.isConsoleOpen);
    const [terminal] = useState(
        () =>
            new Terminal({
                initialLines: [
                    'Serchat(R) Console NT(TM)',
                    '(C) Copyright 1985-1996 Serchat Corp.',
                    '',
                ],
            }),
    );
    const [filesystem] = useState(() => new DosFileSystem());

    const [history, setHistory] = useState(() => terminal.snapshot());
    const [currentInput, setCurrentInput] = useState<string>('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isCommandRunning, setIsCommandRunning] = useState<boolean>(false);
    const [activeProgram, setActiveProgram] = useState<ConsoleProgram | null>(
        null,
    );
    const [cwd, setCwd] = useState(() => filesystem.getCwd());
    const activeProgramRef = useRef<ConsoleProgram | null>(null);

    const consoleRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        terminal.attach(setHistory);
    }, [terminal]);

    useEffect(() => {
        activeProgramRef.current = activeProgram;
    }, [activeProgram]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
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
        return () => clearInterval(interval);
    }, [isOpen, isCommandRunning]);

    useEffect(() => {
        if (!isOpen || !consoleRef.current) return;

        const updateTerminalSize = (): void => {
            const viewport = consoleRef.current?.querySelector(
                '.nt-scroll-area__viewport',
            );
            const element =
                viewport instanceof HTMLElement ? viewport : consoleRef.current;
            const measure = measureRef.current;
            if (!element || !measure) return;

            const style = window.getComputedStyle(element);
            const horizontalPadding =
                parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const verticalPadding =
                parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
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
        return () => resizeObserver.disconnect();
    }, [isOpen, terminal]);

    useEffect(() => {
        const viewport = consoleRef.current?.querySelector(
            '.nt-scroll-area__viewport',
        );
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [history]);

    const handleConsoleClick = (): void => {
        const selection = window.getSelection();
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

        setCommandHistory((prev) => [...prev, input]);
        setHistoryIndex(-1);
        setIsCommandRunning(true);

        void (async () => {
            terminal.puts(fullPromptLine);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const result = await registry.execute(input, {
                dispatch,
                endProgram: () => {
                    activeProgramRef.current = null;
                    setActiveProgram(null);
                },
                filesystem,
                startProgram: (program) => {
                    activeProgramRef.current = program;
                    setActiveProgram(program);
                    program.start();
                },
                terminal,
                writeLine: (line: string) => terminal.puts(line),
                clearScreen: () => terminal.clear(),
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
                preventDefault: () => e.preventDefault(),
            });
            return;
        }

        if (isCommandRunning) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            executeCommand(currentInput);
            setCurrentInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            const newIndex =
                historyIndex === -1
                    ? commandHistory.length - 1
                    : Math.max(0, historyIndex - 1);

            setHistoryIndex(newIndex);
            setCurrentInput(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;

            const newIndex = historyIndex + 1;
            if (newIndex >= commandHistory.length) {
                setHistoryIndex(-1);
                setCurrentInput('');
            } else {
                setHistoryIndex(newIndex);
                setCurrentInput(commandHistory[newIndex]);
            }
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
            onClose={() => dispatch(toggleConsole())}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="flex min-h-0 flex-1 flex-col bg-black font-mono text-[11px] leading-[13px] text-[#c0c0c0]"
                ref={consoleRef}
                onClick={handleConsoleClick}
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

                    {!isCommandRunning && !activeProgram && (
                        <div className="flex flex-wrap items-center select-none">
                            <span>{cwd}&gt;</span>
                            <span className="whitespace-pre select-text">
                                {currentInput}
                            </span>
                            <span className="nt-cursor" />
                        </div>
                    )}

                    <input
                        className="pointer-events-none absolute h-0 w-0 opacity-0"
                        disabled={isCommandRunning}
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </NTScrollArea>
            </div>
        </Window>
    );
};
