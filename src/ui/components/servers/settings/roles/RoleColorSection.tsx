import { Plus, Repeat, Trash2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { Message } from '@/ui/components/chat/Message';
import { Button } from '@/ui/components/common/Button';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { UserItem } from '@/ui/components/common/UserItem';
import { cn } from '@/utils/cn';

type ColorType = 'solid' | 'custom';
interface ColorItem {
    id: string;
    color: string;
}

const ROLE_PREVIEW_TIMESTAMP = new Date().toISOString();

interface RoleColorSectionProps {
    colorType: ColorType;
    solidColor: string;
    customColorItems: ColorItem[];
    gradientRepeat: number;
    me: User | undefined;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    previewRole: Role;
    onChangeColorType: (type: ColorType) => void;
    onChangeSolidColor: (color: string) => void;
    onChangeCustomColorItems: (items: ColorItem[]) => void;
    onChangeGradientRepeat: (value: number) => void;
}

export const RoleColorSection = ({
    colorType,
    solidColor,
    customColorItems,
    gradientRepeat,
    me,
    disableCustomFonts,
    disableGlowAndColors,
    previewRole,
    onChangeColorType,
    onChangeSolidColor,
    onChangeCustomColorItems,
    onChangeGradientRepeat,
}: RoleColorSectionProps): React.ReactNode => (
    <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">
                Role Color
            </span>
            <div className="flex rounded-md border border-border-subtle bg-bg-secondary p-1">
                {(['solid', 'custom'] as const).map((type) => (
                    <Button
                        className={cn(
                            'rounded border-none px-3 py-1 text-xs font-semibold capitalize shadow-none transition-all',
                            colorType === type
                                ? 'bg-primary text-foreground-inverse hover:bg-primary-hover'
                                : 'text-muted-foreground hover:bg-bg-secondary hover:text-foreground',
                        )}
                        key={type}
                        size="sm"
                        variant="ghost"
                        onClick={(): void => {
                            onChangeColorType(type);
                        }}
                    >
                        {type}
                    </Button>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-8">
            <div className="min-w-[200px] space-y-4">
                {colorType === 'solid' ? (
                    <div className="space-y-4">
                        <HexColorPicker
                            color={solidColor}
                            onChange={onChangeSolidColor}
                        />
                        <Input
                            type="text"
                            value={solidColor}
                            variant="secondary"
                            onChange={(e): void => {
                                onChangeSolidColor(e.target.value);
                            }}
                        />
                    </div>
                ) : null}

                {colorType === 'custom' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Text size="xs" variant="muted" weight="bold">
                                COLORS (MAX 15)
                            </Text>
                            <IconButton
                                className="h-8 w-8 p-0"
                                disabled={customColorItems.length >= 15}
                                icon={Plus}
                                iconSize={18}
                                title={
                                    customColorItems.length >= 15
                                        ? 'Maximum of 15 colors reached'
                                        : 'Add Color'
                                }
                                variant="ghost"
                                onClick={(): void => {
                                    if (customColorItems.length >= 15) return;
                                    onChangeCustomColorItems([
                                        ...customColorItems,
                                        {
                                            // react-doctor-disable-next-line react-doctor/rendering-hydration-mismatch-time
                                            id: `color-new-${Math.random()}`,
                                            color: '#ffffff',
                                        },
                                    ]);
                                }}
                            />
                        </div>
                        <div className="scrollbar-thin max-h-[300px] space-y-2 overflow-y-auto pr-2">
                            {customColorItems.map((item, i) => (
                                <div
                                    className="flex items-center gap-2"
                                    key={item.id}
                                >
                                    <div
                                        className="h-8 w-8 shrink-0 rounded border border-border-subtle"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <Input
                                        size="sm"
                                        type="text"
                                        value={item.color}
                                        variant="secondary"
                                        onChange={(e): void => {
                                            const newItems = [
                                                ...customColorItems,
                                            ];
                                            newItems[i] = {
                                                ...item,
                                                color: e.target.value,
                                            };
                                            onChangeCustomColorItems(newItems);
                                        }}
                                    />
                                    {customColorItems.length > 2 ? (
                                        <IconButton
                                            className="h-8 w-8 p-0 text-danger"
                                            icon={Trash2}
                                            iconSize={18}
                                            variant="ghost"
                                            onClick={(): void => {
                                                onChangeCustomColorItems(
                                                    customColorItems.filter(
                                                        (_, idx): boolean =>
                                                            idx !== i,
                                                    ),
                                                );
                                            }}
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex-1 space-y-1">
                                <Text size="xs" variant="muted" weight="bold">
                                    REPEAT
                                </Text>
                                <div className="flex items-center gap-2">
                                    <Repeat
                                        className="text-muted-foreground"
                                        size={14}
                                    />
                                    <Input
                                        className="w-full text-xs"
                                        max={10}
                                        min={1}
                                        type="number"
                                        value={gradientRepeat}
                                        onChange={(e): void => {
                                            onChangeGradientRepeat(
                                                Number.parseInt(
                                                    e.target.value,
                                                ) || 1,
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="flex-1 space-y-4">
                <Text size="sm" variant="muted">
                    Members with this role will have their name displayed in
                    this style in the member list and in messages.
                </Text>
                <div className="w-64 rounded-md border border-border-subtle bg-[var(--tertiary-bg)] p-4">
                    {me ? (
                        <UserItem
                            noFetch
                            disableCustomFonts={disableCustomFonts}
                            disableGlowAndColors={disableGlowAndColors}
                            role={previewRole}
                            user={me}
                            userId={me.id}
                        />
                    ) : null}
                </div>
                <div className="space-y-1">
                    <Text
                        size="xs"
                        tracking="wider"
                        transform="uppercase"
                        variant="muted"
                        weight="bold"
                    >
                        Preview Text
                    </Text>
                    <div className="overflow-hidden rounded-md border border-border-subtle bg-bg-secondary">
                        {me ? (
                            <Message
                                isGroupStart
                                disableCustomFonts={disableCustomFonts}
                                disableGlowAndColors={disableGlowAndColors}
                                message={{
                                    id: 'preview',
                                    text: 'Hello! This is how your role colors will look in the chat.',
                                    createdAt: ROLE_PREVIEW_TIMESTAMP,
                                    serverId: 'preview',
                                    channelId: 'preview',
                                    senderId: me.id,
                                    attachments: [],
                                    embeds: [],
                                    interaction: null,
                                    isEdited: false,
                                    isPinned: false,
                                    isSticky: false,
                                    isWebhook: false,
                                    poll: null,
                                    reactions: [],
                                    stickerId: null,
                                    senderIsBot: false,
                                    role: previewRole,
                                    user: me,
                                }}
                                role={previewRole}
                                user={me}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
