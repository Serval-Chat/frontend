import React, { useState } from 'react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

export const EmojiDebug: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string): void => {
        setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ${message}`,
        ]);
    };

    const testCustomEmojiData = (): void => {
        const mockCustomEmoji = {
            id: '1',
            name: 'testemoji',
            url: '/uploads/emojis/test.png',
        };

        addLog(
            `Custom emoji data: ${JSON.stringify(mockCustomEmoji, null, 2)}`,
        );
    };

    const testEventHandling = (): void => {
        const mockEvent = {
            preventDefault: () => addLog('preventDefault called'),
            stopPropagation: () => addLog('stopPropagation called'),
            target: {
                getBoundingClientRect: () => {
                    const rect = {
                        left: 100,
                        bottom: 150,
                        width: 40,
                        height: 40,
                    };
                    addLog(
                        `getBoundingClientRect called: ${JSON.stringify(rect)}`,
                    );
                    return rect;
                },
            },
        } as {
            preventDefault: () => void;
            stopPropagation: () => void;
            target: {
                getBoundingClientRect: () => {
                    left: number;
                    bottom: number;
                    width: number;
                    height: number;
                };
            };
        };

        addLog('Testing event handling...');
        mockEvent.preventDefault();
        mockEvent.stopPropagation();
        const rect = mockEvent.target.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - 128;
        const y = rect.bottom + 8;
        addLog(`Calculated position: x=${x}, y=${y}`);
    };

    const testApiData = async (): Promise<void> => {
        addLog('Testing API data structure...');

        const mockEmoji = {
            _id: '1',
            name: 'testemoji',
            imageUrl: '/uploads/emojis/test.png',
            serverId: 'server1',
            createdBy: 'user1',
            createdAt: new Date().toISOString(),
        };

        const mockServer = {
            _id: 'server1',
            name: 'Test Server',
            ownerId: 'user1',
            createdAt: new Date().toISOString(),
        };

        addLog(`Emoji structure: ${JSON.stringify(mockEmoji, null, 2)}`);
        addLog(`Server structure: ${JSON.stringify(mockServer, null, 2)}`);
    };

    return (
        <Box className="flex flex-col gap-4 p-4">
            <Text className="text-xl font-bold">Emoji Info Box Debug</Text>

            <Box className="flex gap-2">
                <Button onClick={testCustomEmojiData}>
                    Test Custom Emoji Data
                </Button>
                <Button onClick={testEventHandling}>Test Event Handling</Button>
                <Button onClick={() => void testApiData()}>
                    Test API Data
                </Button>
                <Button onClick={() => setLogs([])}>Clear Logs</Button>
            </Box>

            <Box className="max-h-96 overflow-auto rounded bg-bg-subtle p-4">
                <Text className="font-mono text-sm whitespace-pre-wrap">
                    {logs.length === 0 ? 'No logs yet...' : logs.join('\n')}
                </Text>
            </Box>
        </Box>
    );
};
