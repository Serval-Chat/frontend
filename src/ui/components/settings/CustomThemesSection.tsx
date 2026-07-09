import type { ChangeEvent } from 'react';

import { Download, Trash2, Upload } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';

interface CustomThemeItem {
    id: string;
    name: string;
    sourceCss: string;
    metadata?: { author?: string; description?: string };
}

const downloadCustomTheme = (name: string, css: string): void => {
    const fileName = `${
        name
            .trim()
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, '-')
            .replaceAll(/^-|-$/g, '') || 'serchat-theme'
    }.css`;
    const url = URL.createObjectURL(
        new Blob([css], { type: 'text/css;charset=utf-8' }),
    );
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

interface CustomThemesSectionProps {
    customThemes: CustomThemeItem[];
    theme: string;
    editingThemeId: string | undefined;
    customThemeName: string;
    customThemeCss: string;
    customThemeFileName: string;
    customThemeFileInputRef: React.RefObject<HTMLInputElement | null>;
    setTheme: (theme: string) => void;
    setCustomThemeName: (value: string) => void;
    setCustomThemeCss: (value: string) => void;
    setPendingDeleteThemeId: (value: string | undefined) => void;
    onNewCustomTheme: () => void;
    onEditCustomTheme: (id: string) => void;
    onSaveCustomTheme: () => void;
    onCustomThemeFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const CustomThemesSection = ({
    customThemes,
    theme,
    editingThemeId,
    customThemeName,
    customThemeCss,
    customThemeFileName,
    customThemeFileInputRef,
    setTheme,
    setCustomThemeName,
    setCustomThemeCss,
    setPendingDeleteThemeId,
    onNewCustomTheme,
    onEditCustomTheme,
    onSaveCustomTheme,
    onCustomThemeFileChange,
}: CustomThemesSectionProps): React.ReactNode => (
    <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div>
                <Heading level={4}>Custom CSS Themes</Heading>
                <span className="text-sm text-muted-foreground">
                    Saved CSS is stored locally in this browser and injected
                    when selected.
                </span>
            </div>
            <Button size="sm" variant="ghost" onClick={onNewCustomTheme}>
                New CSS Theme
            </Button>
        </div>

        {customThemes.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {customThemes.map((customTheme) => (
                    <div
                        className="flex items-start justify-between gap-3 rounded-md border border-border-subtle bg-bg-subtle p-3"
                        key={customTheme.id}
                    >
                        <button
                            className="min-w-0 flex-1 text-left"
                            type="button"
                            onClick={(): void => {
                                onEditCustomTheme(customTheme.id);
                            }}
                        >
                            <span className="block truncate text-sm font-bold text-foreground">
                                {customTheme.name}
                            </span>
                            {customTheme.metadata?.author ? (
                                <span className="block text-xs text-muted-foreground">
                                    by {customTheme.metadata.author}
                                </span>
                            ) : null}
                            {customTheme.metadata?.description ? (
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {customTheme.metadata.description}
                                </span>
                            ) : null}
                            <span className="mt-1 block text-xs text-muted-foreground">
                                {theme === `custom:${customTheme.id}`
                                    ? '✓ Active'
                                    : 'Saved locally'}
                            </span>
                        </button>
                        <div className="flex flex-col gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(): void => {
                                    setTheme(`custom:${customTheme.id}`);
                                }}
                            >
                                Use
                            </Button>
                            <Button
                                className="min-w-0 px-2"
                                size="sm"
                                variant="ghost"
                                onClick={(): void => {
                                    downloadCustomTheme(
                                        customTheme.name,
                                        customTheme.sourceCss,
                                    );
                                }}
                            >
                                <Download size={16} />
                            </Button>
                            <Button
                                className="min-w-0 px-2"
                                size="sm"
                                variant="ghost"
                                onClick={(): void => {
                                    setPendingDeleteThemeId(customTheme.id);
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border-subtle bg-bg-subtle p-4">
            <input
                accept=".css,text/css"
                aria-label="Upload custom theme CSS"
                className="hidden"
                ref={customThemeFileInputRef}
                type="file"
                onChange={onCustomThemeFileChange}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <span className="block text-xs font-bold text-muted-foreground uppercase">
                        CSS Theme File
                    </span>
                    <span className="block truncate text-sm text-foreground">
                        {customThemeFileName || 'No CSS file selected'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        icon={Download}
                        size="sm"
                        variant="ghost"
                        onClick={(): void => {
                            const link = document.createElement('a');
                            link.href = '/example.css';
                            link.download = 'example.css';
                            link.click();
                        }}
                    >
                        Example CSS
                    </Button>
                    <Button
                        icon={Upload}
                        size="sm"
                        variant="ghost"
                        onClick={(): void =>
                            customThemeFileInputRef.current?.click()
                        }
                    >
                        Upload CSS
                    </Button>
                </div>
            </div>
            <label
                className="text-xs font-bold text-muted-foreground uppercase"
                htmlFor="custom-theme-name"
            >
                Theme Name
            </label>
            <input
                className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                id="custom-theme-name"
                placeholder="My Serchat Theme"
                type="text"
                value={customThemeName}
                onChange={(e): void => {
                    setCustomThemeName(e.target.value);
                }}
            />
            <label
                className="text-xs font-bold text-muted-foreground uppercase"
                htmlFor="custom-theme-css"
            >
                CSS
            </label>
            <textarea
                className="custom-scrollbar min-h-64 w-full resize-y rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 font-mono text-sm leading-6 text-foreground focus:border-primary focus:outline-none"
                id="custom-theme-css"
                placeholder="[data-custom-theme] {&#10;  --background: #101014;&#10;  --foreground: #f4f4f5;&#10;  --primary: #7cdbff;&#10;}"
                spellCheck={false}
                value={customThemeCss}
                onChange={(e): void => {
                    setCustomThemeCss(e.target.value);
                }}
            />
            <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={onNewCustomTheme}>
                    Clear
                </Button>
                <Button size="sm" variant="primary" onClick={onSaveCustomTheme}>
                    {editingThemeId ? 'Save CSS Theme' : 'Add CSS Theme'}
                </Button>
            </div>
        </div>
    </div>
);
