import React from 'react';

const SIDEBAR_ITEMS = 7;
const GRID_CELLS = 40;

export const EmojiPickerSkeleton = (): React.JSX.Element => (
    <div
        aria-busy="true"
        aria-label="Loading emojis"
        className="flex h-[400px] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-border-subtle bg-bg-primary shadow-xl"
        role="status"
    >
        <div className="flex w-11 flex-shrink-0 flex-col items-center gap-2 border-r border-divider/30 py-3">
            {Array.from({ length: SIDEBAR_ITEMS }, (_, i) => (
                <div
                    className="h-6 w-6 animate-pulse rounded-full bg-bg-subtle"
                    key={i}
                />
            ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-divider/30 px-3 py-2">
                <div className="h-8 animate-pulse rounded-md bg-bg-subtle" />
            </div>
            <div className="flex-1 overflow-hidden px-3 py-3">
                <div className="mb-3 h-3 w-20 animate-pulse rounded bg-bg-subtle" />
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: GRID_CELLS }, (_, i) => (
                        <div
                            className="h-7 w-7 animate-pulse rounded-md bg-bg-subtle"
                            key={i}
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
);
