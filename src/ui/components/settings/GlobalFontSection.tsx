import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';

interface GlobalFontSectionProps {
    localCustomFontUrl: string;
    localCustomFontFamily: string;
    setLocalCustomFontUrl: (value: string) => void;
    setLocalCustomFontFamily: (value: string) => void;
}

export const GlobalFontSection = ({
    localCustomFontUrl,
    localCustomFontFamily,
    setLocalCustomFontUrl,
    setLocalCustomFontFamily,
}: GlobalFontSectionProps): React.ReactNode => (
    <div className="space-y-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <Heading level={4}>Global Font</Heading>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(): void => {
                        setLocalCustomFontUrl('');
                        setLocalCustomFontFamily('');
                    }}
                >
                    Reset to Default
                </Button>
            </div>
            <span className="text-sm text-muted-foreground">
                Apply a custom font by providing a Google APIs link to the font.
            </span>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold text-muted-foreground uppercase"
                        htmlFor="custom-font-url"
                    >
                        Google Font CDN URL
                    </label>
                    <input
                        className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        id="custom-font-url"
                        placeholder="https://fonts.googleapis.com/css2?family=..."
                        type="text"
                        value={localCustomFontUrl}
                        onChange={(e): void => {
                            setLocalCustomFontUrl(e.target.value);
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold text-muted-foreground uppercase"
                        htmlFor="custom-font-family"
                    >
                        Font Family Name
                    </label>
                    <input
                        className="w-full rounded-md border border-border-subtle bg-bg-secondary px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        id="custom-font-family"
                        placeholder="e.g. Open Sans"
                        type="text"
                        value={localCustomFontFamily}
                        onChange={(e): void => {
                            setLocalCustomFontFamily(e.target.value);
                        }}
                    />
                </div>
            </div>
        </div>
    </div>
);
