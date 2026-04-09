import React, { useMemo } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Window } from '@/ui/components/common/Window';
import { toggleWsDebugWindow, useWsDebugEvents } from '@/ws/debug';

const SCROLLBAR_STYLES = `
    .nt-scrollbar::-webkit-scrollbar {
        width: 16px;
        height: 16px;
    }
    .nt-scrollbar::-webkit-scrollbar-button {
        background-color: #c0c0c0;
        border: 1px solid;
        border-color: #ffffff #000000 #000000 #ffffff;
    }
    .nt-scrollbar::-webkit-scrollbar-thumb {
        background-color: #c0c0c0;
        border: 1px solid;
        border-color: #ffffff #000000 #000000 #ffffff;
    }
    .nt-scrollbar::-webkit-scrollbar-track {
        background-color: #dfdfdf;
        background-image:
            repeating-linear-gradient(45deg, #c0c0c0 25%, transparent 25%, transparent 75%, #c0c0c0 75%, #c0c0c0),
            repeating-linear-gradient(45deg, #c0c0c0 25%, #dfdfdf 25%, #dfdfdf 75%, #c0c0c0 75%, #c0c0c0);
        background-position: 0 0, 2px 2px;
        background-size: 4px 4px;
    }
    .nt-font {
        font-family: 'MS Sans Serif', Tahoma, sans-serif;
    }
`;

const PAYLOAD_STYLE = {
    backgroundColor: 'transparent',
    margin: 0,
    padding: '4px',
    fontSize: '10px',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
} as const;

export const WsDebugger: React.FC = () => {
    const events = useWsDebugEvents();

    const filteredEvents = useMemo(
        () =>
            events.filter((e) => !(e.direction === 'in' && e.type === 'pong')),
        [events],
    );

    return (
        <Window
            defaultHeight={450}
            defaultWidth={600}
            defaultX={100}
            defaultY={100}
            icon="/icons/retro/chip.png"
            minHeight={250}
            minWidth={400}
            title={`WebSocket Logger (${filteredEvents.length} events)`}
            onClose={toggleWsDebugWindow}
        >
            <style>{SCROLLBAR_STYLES}</style>
            <div className="nt-scrollbar nt-font min-h-0 flex-1 overflow-x-auto overflow-y-auto bg-white p-1">
                {filteredEvents.length === 0 ? (
                    <div className="py-8 text-center text-sm font-bold text-gray-500">
                        Waiting for events...
                    </div>
                ) : (
                    <table className="w-full table-fixed border-collapse text-left">
                        <colgroup>
                            <col style={{ width: '85px' }} />
                            <col style={{ width: '45px' }} />
                            <col style={{ width: '150px' }} />
                            <col style={{ width: 'auto' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-[#dfdfdf] shadow-[inset_1px_1px_#ffffff,inset_-1px_-1px_#808080]">
                                <th className="border border-[#808080] p-1 text-[10px] font-bold text-black">
                                    Time
                                </th>
                                <th className="border border-[#808080] p-1 text-center text-[10px] font-bold text-black">
                                    Dir
                                </th>
                                <th className="border border-[#808080] p-1 text-[10px] font-bold text-black">
                                    Event
                                </th>
                                <th className="border border-[#808080] p-1 text-[10px] font-bold text-black">
                                    Payload
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((event) => {
                                const date = new Date(event.timestamp);
                                const ms = String(
                                    date.getMilliseconds(),
                                ).padStart(3, '0');

                                return (
                                    <tr
                                        className="border-b border-[#dfdfdf] text-[10px] hover:bg-[#ffffcc]"
                                        key={event.id}
                                    >
                                        <td className="w-16 p-1 align-top whitespace-nowrap text-gray-600">
                                            {date.toLocaleTimeString()}
                                            <br />
                                            <span className="text-[9px]">
                                                .{ms}
                                            </span>
                                        </td>
                                        <td className="w-12 p-1 text-center align-top font-bold text-[#0000aa]">
                                            {event.direction.toUpperCase()}
                                        </td>
                                        <td className="min-w-[120px] p-1 align-top font-bold break-words text-black">
                                            {event.type}
                                        </td>
                                        <td className="p-1 align-top text-gray-700">
                                            {!!event.payload && (
                                                <div className="nt-scrollbar max-h-64 w-full overflow-y-auto border border-[#dfdfdf] border-r-[#808080] border-b-[#808080] bg-white shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#ffffff]">
                                                    <SyntaxHighlighter
                                                        wrapLines
                                                        wrapLongLines
                                                        customStyle={
                                                            PAYLOAD_STYLE
                                                        }
                                                        language="json"
                                                        style={vs}
                                                    >
                                                        {JSON.stringify(
                                                            event.payload,
                                                            null,
                                                            2,
                                                        )}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </Window>
    );
};
