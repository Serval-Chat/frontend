import React, { useMemo } from 'react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { NTScrollArea } from '@/ui/components/nt/NTScrollArea';
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

const getPayloadText = (payload: unknown): string =>
    JSON.stringify(payload, null, 2) ?? String(payload);

const getPayloadPreview = (payload: unknown): string =>
    JSON.stringify(payload) ?? String(payload);

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
            <NTScrollArea
                className="min-h-0 flex-1 bg-white font-nt"
                viewportClassName="p-1"
            >
                {filteredEvents.length === 0 ? (
                    <div className="py-8 text-center text-sm font-bold text-gray-500">
                        Waiting for events...
                    </div>
                ) : (
                    <NTTable
                        className="[&_th:nth-child(1)]:w-16 [&_th:nth-child(2)]:w-10 [&_th:nth-child(3)]:w-28"
                        headers={['Time', 'Dir', 'Event', 'Payload']}
                    >
                        {filteredEvents.map((event) => {
                            const date = new Date(event.timestamp);
                            const ms = String(date.getMilliseconds()).padStart(
                                3,
                                '0',
                            );
                            const hasPayload = event.payload != null;
                            const payloadText = hasPayload
                                ? getPayloadText(event.payload)
                                : '';
                            const payloadPreview = hasPayload
                                ? getPayloadPreview(event.payload)
                                : '';

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
                                    <td
                                        className="w-28 p-1 align-top font-bold text-black"
                                        title={event.type}
                                    >
                                        <div className="[overflow-wrap:anywhere] whitespace-normal">
                                            {event.type}
                                        </div>
                                    </td>
                                    <td className="min-w-0 p-1 align-top text-gray-700">
                                        {hasPayload && (
                                            <details className="min-w-0">
                                                <summary
                                                    className="block max-h-12 cursor-pointer overflow-hidden text-[10px] [overflow-wrap:anywhere] whitespace-normal text-gray-700"
                                                    title={payloadPreview}
                                                >
                                                    {payloadPreview}
                                                </summary>
                                                <NTScrollArea className="h-32 w-full border border-[#dfdfdf] border-r-[#808080] border-b-[#808080] bg-white shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#ffffff]">
                                                    <SyntaxHighlighter
                                                        wrapLines
                                                        wrapLongLines
                                                        customStyle={
                                                            PAYLOAD_STYLE
                                                        }
                                                        language="json"
                                                        style={vs}
                                                    >
                                                        {payloadText}
                                                    </SyntaxHighlighter>
                                                </NTScrollArea>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </NTTable>
                )}
            </NTScrollArea>
        </Window>
    );
};
