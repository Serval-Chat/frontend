import React, { useState } from 'react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';

export const EmojiInfoTest: React.FC = () => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string>('');

    const handleEmojiSelect = (emoji: string): void => {
        setSelectedEmoji(emoji);
        setShowPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
        url: string;
    }): void => {
        setSelectedEmoji(`:${emoji.name}:`);
        setShowPicker(false);
    };

    const mockCustomCategories = [
        {
            id: 'test-server-1',
            name: 'Test Server 1',
            icon: undefined,
            emojis: [
                {
                    id: '1',
                    name: 'testemoji',
                    url: '/uploads/emojis/test.png',
                },
                {
                    id: '2',
                    name: 'another',
                    url: '/uploads/emojis/another.png',
                },
            ],
        },
    ];

    return (
        <Box className="flex flex-col items-center gap-4 p-8">
            <Text className="text-2xl font-bold">Emoji Info Box Test</Text>

            <Box className="flex flex-col items-center gap-2">
                <Text>Selected Emoji: {selectedEmoji || 'None'}</Text>
                <Button onClick={() => setShowPicker(!showPicker)}>
                    {showPicker ? 'Hide' : 'Show'} Emoji Picker
                </Button>
            </Box>

            {showPicker && (
                <Box className="relative">
                    <EmojiPicker
                        customCategories={mockCustomCategories}
                        onCustomEmojiSelect={handleCustomEmojiSelect}
                        onEmojiSelect={handleEmojiSelect}
                    />
                    <Text className="mt-4 text-sm text-muted-foreground">
                        Right-click on custom emojis to see info box
                    </Text>
                </Box>
            )}
        </Box>
    );
};
