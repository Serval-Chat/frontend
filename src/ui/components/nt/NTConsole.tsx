import React, { useEffect, useRef, useState } from 'react';

import { registry } from '@/console';
import { parseAnsi } from '@/console/utils/ansiParser';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleConsole } from '@/store/slices/debugOptionsSlice';
import { NTScrollArea } from '@/ui/components/nt/NTScrollArea';
import { Window } from '@/ui/components/nt/Window';

interface ConsoleLine {
    id: string;
    text: string;
}

export const NTConsole: React.FC = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.debugOptions.isConsoleOpen);

    const [history, setHistory] = useState<ConsoleLine[]>([
        { id: '1', text: 'Serchat(R) Console NT(TM)' },
        { id: '2', text: '(C) Copyright 1985-1996 Serchat Corp.' },
        { id: '3', text: '' },
    ]);
    const [currentInput, setCurrentInput] = useState<string>('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isCommandRunning, setIsCommandRunning] = useState<boolean>(false);

    const consoleRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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

    const generateId = (): string => Math.random().toString(36).substring(2, 9);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (isCommandRunning) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            const command = currentInput.trim();
            const fullPromptLine = `C:\\WINNT\\System32>${currentInput}`;

            const newHistory = [
                ...history,
                { id: generateId(), text: fullPromptLine },
            ];

            if (command) {
                const newCmdHistory = [...commandHistory, currentInput];
                setCommandHistory(newCmdHistory);
                setHistoryIndex(-1);
                setIsCommandRunning(true);

                void (async () => {
                    const commandLineId = generateId();
                    setHistory((prev) => [
                        ...prev,
                        { id: commandLineId, text: fullPromptLine },
                    ]);
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    let updateLineId: string | null = null;

                    const result = await registry.execute(currentInput, {
                        dispatch,
                        writeLine: (line: string) => {
                            setHistory((prev) => {
                                if (line.startsWith('\r')) {
                                    const newPrev = [...prev];
                                    if (updateLineId) {
                                        const updateIndex = newPrev.findIndex(
                                            (entry) =>
                                                entry.id === updateLineId,
                                        );
                                        if (updateIndex !== -1) {
                                            newPrev[updateIndex] = {
                                                ...newPrev[updateIndex],
                                                text: line.replace(/^\r/, ''),
                                            };
                                            return newPrev;
                                        }
                                    }
                                    if (newPrev.length > 0) {
                                        const lastEntry =
                                            newPrev[newPrev.length - 1];
                                        if (lastEntry.id === commandLineId) {
                                            const newId = generateId();
                                            updateLineId = newId;
                                            return [
                                                ...newPrev,
                                                {
                                                    id: newId,
                                                    text: line.replace(
                                                        /^\r/,
                                                        '',
                                                    ),
                                                },
                                            ];
                                        }
                                        updateLineId = lastEntry.id;
                                        newPrev[newPrev.length - 1] = {
                                            ...lastEntry,
                                            text: line.replace(/^\r/, ''),
                                        };
                                        return newPrev;
                                    }
                                    const newId = generateId();
                                    updateLineId = newId;
                                    return [
                                        ...newPrev,
                                        {
                                            id: newId,
                                            text: line.replace(/^\r/, ''),
                                        },
                                    ];
                                }
                                updateLineId = null;
                                return [
                                    ...prev,
                                    { id: generateId(), text: line },
                                ];
                            });
                        },
                    });

                    if (result.clear) {
                        setHistory([]);
                    } else if (result.output) {
                        setHistory((prev) => [
                            ...prev,
                            ...(result.output ?? []).map((line) => ({
                                id: generateId(),
                                text: line,
                            })),
                        ]);
                    }

                    setIsCommandRunning(false);
                })();
            } else {
                newHistory.push({ id: generateId(), text: '' });
                setHistory(newHistory);
            }

            setCurrentInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            let newIndex = historyIndex;
            if (historyIndex === -1) {
                newIndex = commandHistory.length - 1;
            } else if (historyIndex > 0) {
                newIndex = historyIndex - 1;
            }

            setHistoryIndex(newIndex);
            setCurrentInput(commandHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;

            let newIndex = historyIndex + 1;
            if (newIndex >= commandHistory.length) {
                newIndex = -1;
                setCurrentInput('');
            } else {
                setCurrentInput(commandHistory[newIndex]);
            }
            setHistoryIndex(newIndex);
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

                    {!isCommandRunning && (
                        <div className="flex flex-wrap items-center select-none">
                            <span>C:\WINNT\System32&gt;</span>
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
