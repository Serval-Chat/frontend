import type { ReactNode } from 'react';

import { useQuery } from '@tanstack/react-query';

import { TopNavBar } from '@/app/layout/TopNavBar';
import { ParsedText } from '@/features/messages/ParsedText';
import { Box } from '@/ui/primitives/Box';
import { Heading } from '@/ui/primitives/Heading';
import { Text } from '@/ui/primitives/Text';
import { APP_LOCALE } from '@/utils/locale';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

const LAST_UPDATED_RE = /<LAST_UPDATED>(\d+)<\/LAST_UPDATED>\n?/;
const CURRENT_YEAR = new Date().getFullYear();

function extractLastUpdated(raw: string): {
    ts: number | null;
    content: string;
} {
    const match = LAST_UPDATED_RE.exec(raw);
    if (!match) return { ts: null, content: raw };
    return {
        ts: Number.parseInt(match[1]!, 10),
        content: raw.replace(LAST_UPDATED_RE, ''),
    };
}

export const Tos = (): ReactNode => {
    const { data: raw, isError: error } = useQuery({
        queryKey: ['tos'],
        queryFn: async (): Promise<string> => {
            const res = await fetch('/tos.md');
            if (!res.ok) throw new Error('Failed to fetch');
            return res.text();
        },
        staleTime: Infinity,
    });

    const { ts, content } =
        raw === undefined ? { ts: null, content: '' } : extractLastUpdated(raw);
    const nodes = content ? parseText(content, ParserPresets.MESSAGE) : [];

    const lastUpdated = ts
        ? new Date(ts * 1000).toLocaleDateString(APP_LOCALE, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <Box className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
            <TopNavBar />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
                <div className="mb-8">
                    <Heading
                        className="text-3xl font-extrabold tracking-tight text-foreground"
                        level={1}
                        variant="page"
                    >
                        Terms of Service
                    </Heading>
                    {lastUpdated ? (
                        <Text as="p" className="mt-1" size="sm" variant="muted">
                            Last updated: {lastUpdated}
                        </Text>
                    ) : null}
                </div>

                {error ? (
                    <Text as="p" variant="danger">
                        Failed to load Terms of Service.
                    </Text>
                ) : raw === undefined ? (
                    <div className="space-y-3">
                        {/* eslint-disable react/no-array-index-key */}
                        {Array.from({ length: 10 }).map(
                            (_, i): ReactNode => (
                                <div
                                    className="h-4 animate-pulse rounded bg-bg-subtle"
                                    key={String(i)}
                                    style={{ width: `${65 + (i % 4) * 8}%` }}
                                />
                            ),
                        )}
                        {/* eslint-enable react/no-array-index-key */}
                    </div>
                ) : (
                    <ParsedText nodes={nodes} size="sm" />
                )}
            </main>

            <footer className="mx-8 border-t border-border-subtle py-8 text-center text-sm text-muted-foreground">
                <Text as="p">
                    &copy; {CURRENT_YEAR} Serchat. Made with love for everyone.
                </Text>
            </footer>
        </Box>
    );
};
