import { type ReactNode, useState } from 'react';

import { EmbedCreator } from '@/features/embed/EmbedCreator';
import { EmbedRenderer } from '@/features/embed/EmbedRenderer';
import type { MessagePayload } from '@/types/embed';
import { Heading } from '@/ui/primitives/Heading';
import { Text } from '@/ui/primitives/Text';

const DEFAULT_PAYLOAD: MessagePayload = {
    embeds: [
        {
            type: 'rich',
            title: 'My first embed',
            description:
                'Edit this embed using the form on the left. The preview updates in real time.',
            footer: { text: 'Serchat Embed Builder' },
        },
    ],
};

export const EmbedBuilder = (): ReactNode => {
    const [payload, setPayload] = useState<MessagePayload>(DEFAULT_PAYLOAD);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-background/80 px-6 py-4 backdrop-blur-sm">
                <div>
                    <Heading
                        className="text-lg font-bold tracking-tight text-foreground"
                        level={1}
                        variant="page"
                    >
                        Embed Builder
                    </Heading>
                    <Text as="p" size="xs" variant="muted">
                        Compose Serchat message embeds with a preview
                    </Text>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="custom-scrollbar flex-1 overflow-y-auto border-r border-border-subtle px-6 py-6">
                    <EmbedCreator value={payload} onChange={setPayload} />
                </div>

                <div className="custom-scrollbar flex w-[480px] shrink-0 flex-col overflow-y-auto bg-bg-subtle px-6 py-6">
                    <Text
                        as="p"
                        className="mb-4"
                        size="xs"
                        tracking="wider"
                        transform="uppercase"
                        variant="muted"
                        weight="semibold"
                    >
                        Live preview
                    </Text>
                    <EmbedRenderer className="w-full" payload={payload} />
                </div>
            </div>
        </div>
    );
};
