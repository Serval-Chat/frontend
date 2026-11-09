import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { Input } from '@/ui/primitives/Input';
import { Label } from '@/ui/primitives/Label';
import { Text } from '@/ui/primitives/Text';

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
            <Text size="sm" variant="muted">
                Apply a custom font by providing a Google APIs link to the font.
            </Text>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="custom-font-url">Google Font CDN URL</Label>
                    <Input
                        id="custom-font-url"
                        placeholder="https://fonts.googleapis.com/css2?family=..."
                        type="text"
                        value={localCustomFontUrl}
                        variant="secondary"
                        onChange={(e): void => {
                            setLocalCustomFontUrl(e.target.value);
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="custom-font-family">Font Family Name</Label>
                    <Input
                        id="custom-font-family"
                        placeholder="e.g. Open Sans"
                        type="text"
                        value={localCustomFontFamily}
                        variant="secondary"
                        onChange={(e): void => {
                            setLocalCustomFontFamily(e.target.value);
                        }}
                    />
                </div>
            </div>
        </div>
    </div>
);
