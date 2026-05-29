import { type ReactNode, useEffect, useState } from 'react';

import type { JSX } from 'react/jsx-runtime';

import { ParsedText } from '@/ui/components/common/ParsedText';
import { Box } from '@/ui/components/layout/Box';
import { TopNavBar } from '@/ui/components/layout/TopNavBar';
import { APP_LOCALE } from '@/utils/locale';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

const LAST_UPDATED_RE = /<LAST_UPDATED>(\d+)<\/LAST_UPDATED>\n?/;

function extractLastUpdated(raw: string): {
    ts: number | null;
    content: string;
} {
    const match = raw.match(LAST_UPDATED_RE);
    if (!match) return { ts: null, content: raw };
    return {
        ts: parseInt(match[1], 10),
        content: raw.replace(LAST_UPDATED_RE, ''),
    };
}

export const Tos = (): ReactNode => {
    const [raw, setRaw] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect((): void => {
        fetch('/tos.md')
            .then((res): Promise<string> => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.text();
            })
            .then(setRaw)
            .catch((): void => setError(true));
    }, []);

    const { ts, content } =
        raw !== null ? extractLastUpdated(raw) : { ts: null, content: '' };
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
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Terms of Service
                    </h1>
                    {lastUpdated && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Last updated: {lastUpdated}
                        </p>
                    )}
                </div>

                {error ? (
                    <p className="text-danger">
                        Failed to load Terms of Service.
                    </p>
                ) : raw === null ? (
                    <div className="space-y-3">
                        {/* eslint-disable react/no-array-index-key */}
                        {Array.from({ length: 10 }).map(
                            (_, i): JSX.Element => (
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
                <p>
                    &copy; {new Date().getFullYear()} Serchat. Made with love
                    for everyone.
                </p>
            </footer>
        </Box>
    );
};
