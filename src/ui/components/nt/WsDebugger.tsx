import React, { useMemo } from 'react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { NTTable } from '@/ui/components/nt/NTTable';
import { Window } from '@/ui/components/nt/Window';
import { APP_LOCALE } from '@/utils/locale';
import { toggleWsDebugWindow, useWsDebugEvents } from '@/ws/debug';

const PAYLOAD_STYLE = {
    backgroundColor: 'transparent',
    margin: 0,
    padding: '4px',
    fontSize: '10px',
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
            <div className="nt-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-1 font-nt">
                {filteredEvents.length === 0 ? (
                    <div className="py-8 text-center text-sm font-bold text-gray-500">
                        Waiting for events...
                    </div>
                ) : (
                    <NTTable headers={['Time', 'Dir', 'Event', 'Payload']}>
                        {filteredEvents.map((event) => {
                            const date = new Date(event.timestamp);
                            const ms = String(date.getMilliseconds()).padStart(
                                3,
                                '0',
                            );

                            return (
                                <tr
                                    className="border-b border-[#dfdfdf] text-[10px] hover:bg-[#ffffcc]"
                                    key={event.id}
                                >
                                    <td className="w-16 p-1 align-top whitespace-nowrap text-gray-600">
                                        {date.toLocaleTimeString(APP_LOCALE)}
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
                                                    customStyle={PAYLOAD_STYLE}
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
                    </NTTable>
                )}
            </div>
        </Window>
    );
};
