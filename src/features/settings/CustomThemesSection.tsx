import type { ChangeEvent } from 'react';

import { Download, Trash2, Upload } from 'lucide-react';

import { Button } from '@/ui/primitives/Button';
import { FileInput } from '@/ui/primitives/FileInput';
import { Heading } from '@/ui/primitives/Heading';
import { Input } from '@/ui/primitives/Input';
import { Label } from '@/ui/primitives/Label';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';

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
                <Text size="sm" variant="muted">
                    Saved CSS is stored locally in this browser and injected
                    when selected.
                </Text>
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
                        <Pressable
                            className="min-w-0 flex-1 text-left"
                            onClick={(): void => {
                                onEditCustomTheme(customTheme.id);
                            }}
                        >
                            <Text
                                className="block truncate"
                                size="sm"
                                variant="default"
                                weight="bold"
                            >
                                {customTheme.name}
                            </Text>
                            {customTheme.metadata?.author ? (
                                <Text
                                    className="block"
                                    size="xs"
                                    variant="muted"
                                >
                                    by {customTheme.metadata.author}
                                </Text>
                            ) : null}
                            {customTheme.metadata?.description ? (
                                <Text
                                    className="mt-1 block"
                                    size="xs"
                                    variant="muted"
                                >
                                    {customTheme.metadata.description}
                                </Text>
                            ) : null}
                            <Text
                                className="mt-1 block"
                                size="xs"
                                variant="muted"
                            >
                                {theme === `custom:${customTheme.id}`
                                    ? '✓ Active'
                                    : 'Saved locally'}
                            </Text>
                        </Pressable>
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
                                aria-label={`Download ${customTheme.name} theme`}
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
                                aria-label={`Delete ${customTheme.name} theme`}
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
            <FileInput
                accept=".css,text/css"
                aria-label="Upload custom theme CSS"
                ref={customThemeFileInputRef}
                onChange={onCustomThemeFileChange}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <Text
                        className="block"
                        size="xs"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        CSS Theme File
                    </Text>
                    <Text
                        className="block truncate"
                        size="sm"
                        variant="default"
                    >
                        {customThemeFileName || 'No CSS file selected'}
                    </Text>
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
            <Label htmlFor="custom-theme-name">Theme Name</Label>
            <Input
                id="custom-theme-name"
                placeholder="My Serchat Theme"
                type="text"
                value={customThemeName}
                variant="secondary"
                onChange={(e): void => {
                    setCustomThemeName(e.target.value);
                }}
            />
            <Label htmlFor="custom-theme-css">CSS</Label>
            {/* eslint-disable-next-line no-ui/no-raw-controls-outside-primitives -- code editor: needs monospace, min-h-64 and manual resize, which the auto-growing TextArea does not support */}
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
