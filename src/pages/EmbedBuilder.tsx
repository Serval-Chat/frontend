import { type ReactNode, useState } from 'react';

import type { MessagePayload } from '@/types/embed';
import { EmbedCreator } from '@/ui/components/embed/EmbedCreator';
import { EmbedRenderer } from '@/ui/components/embed/EmbedRenderer';

const DEFAULT_PAYLOAD: MessagePayload = {
    embeds: [
        {
            type: 'rich',
            color: 0x5865f2,
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
                    <h1 className="text-lg font-bold tracking-tight text-foreground">
                        Embed Builder
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Compose Serchat message embeds with a preview
                    </p>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="custom-scrollbar flex-1 overflow-y-auto border-r border-border-subtle px-6 py-6">
                    <EmbedCreator value={payload} onChange={setPayload} />
                </div>

                <div className="custom-scrollbar flex w-[480px] shrink-0 flex-col overflow-y-auto bg-bg-subtle px-6 py-6">
                    <p className="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Live preview
                    </p>
                    <EmbedRenderer className="w-full" payload={payload} />
                </div>
            </div>
        </div>
    );
};
