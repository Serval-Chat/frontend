import { useMemo } from 'react';

import { Plus, Tag, X } from 'lucide-react';

import { useServerDiscoveryStatus } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { Toggle } from '@/ui/components/common/Toggle';

const DESCRIPTION_BLOCKER = 'Server must have a description.';
const TAGS_BLOCKER = 'Server must have at least one tag.';
const OPT_IN_BLOCKER = 'Server must opt in to discovery.';

interface ServerInfoSectionProps {
    name: string;
    description: string;
    tags: string[];
    tagInput: string;
    discoveryEnabled: boolean;
    serverId: string;
    onChangeName: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onChangeTagInput: (value: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
    onToggleDiscovery: (value: boolean) => void;
}

export const ServerInfoSection = ({
    name,
    description,
    tags,
    tagInput,
    discoveryEnabled,
    serverId,
    onChangeName,
    onChangeDescription,
    onChangeTagInput,
    onAddTag,
    onRemoveTag,
    onToggleDiscovery,
}: ServerInfoSectionProps): React.ReactNode => {
    const { data: discoveryStatus } = useServerDiscoveryStatus(serverId);

    const effectiveDiscoveryBlockers = useMemo((): string[] => {
        if (!discoveryStatus) return [];

        const blockers = discoveryStatus.blockers.filter((blocker): boolean => {
            if (blocker === DESCRIPTION_BLOCKER) {
                return description.trim() === '';
            }
            if (blocker === TAGS_BLOCKER) {
                return tags.length === 0;
            }
            if (blocker === OPT_IN_BLOCKER) {
                return !discoveryEnabled;
            }
            return true;
        });

        if (
            discoveryEnabled &&
            description.trim() === '' &&
            !blockers.includes(DESCRIPTION_BLOCKER)
        ) {
            blockers.push(DESCRIPTION_BLOCKER);
        }

        if (
            discoveryEnabled &&
            tags.length === 0 &&
            !blockers.includes(TAGS_BLOCKER)
        ) {
            blockers.push(TAGS_BLOCKER);
        }

        return blockers;
    }, [description, discoveryEnabled, discoveryStatus, tags]);

    return (
        <div className="flex-1 space-y-8">
            <div className="space-y-2">
                <label
                    className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                    htmlFor="serverName"
                >
                    Server Name
                </label>
                <Input
                    id="serverName"
                    placeholder="Enter server name"
                    value={name}
                    onChange={(e): void => {
                        onChangeName(e.target.value);
                    }}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="serverDescription"
                    >
                        Server Description
                    </label>
                    <Text size="2xs" variant="muted" weight="bold">
                        {description.length}/500
                    </Text>
                </div>
                <TextArea
                    autoResize
                    id="serverDescription"
                    maxLength={500}
                    placeholder="Tell people what your server is about..."
                    value={description}
                    onChange={(e): void => {
                        onChangeDescription(e.target.value.slice(0, 500));
                    }}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="serverTags"
                    >
                        Server Tags
                    </label>
                    <Text size="2xs" variant="muted" weight="bold">
                        {tags.length}/8 Tags
                    </Text>
                </div>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            className="flex-1"
                            id="serverTags"
                            maxLength={25}
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e): void => {
                                onChangeTagInput(e.target.value);
                            }}
                            onKeyDown={(e): void => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onAddTag();
                                }
                            }}
                        />
                        <Button
                            className="px-4"
                            disabled={!tagInput.trim() || tags.length >= 8}
                            size="sm"
                            variant="primary"
                            onClick={onAddTag}
                        >
                            <Plus size={16} />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <div
                                className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 py-1 pr-1 pl-3 text-xs font-bold text-primary"
                                key={tag}
                            >
                                <Tag className="opacity-60" size={10} />
                                {tag}
                                <button
                                    className="rounded-full p-1 opacity-60 transition-all hover:bg-primary/20 hover:opacity-100"
                                    type="button"
                                    onClick={(): void => {
                                        onRemoveTag(tag);
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {tags.length === 0 ? (
                            <Text
                                className="py-1 italic"
                                size="xs"
                                variant="muted"
                            >
                                No tags added yet. Try "Hangout" or "Gaming".
                            </Text>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Text as="p" weight="bold">
                            Show in Server Discovery
                        </Text>
                        <Text as="p" size="xs" variant="muted">
                            Discovery requires a description, at least one tag,
                            verification, and a vanity invite with unlimited
                            uses and no expiry.
                        </Text>
                    </div>
                    <Toggle
                        aria-label="Show in Server Discovery"
                        checked={discoveryEnabled}
                        onCheckedChange={onToggleDiscovery}
                    />
                </div>
                {discoveryEnabled && effectiveDiscoveryBlockers.length > 0 ? (
                    <div className="rounded-md border border-caution/30 bg-caution/10 p-3">
                        <Text
                            className="mb-2 text-caution"
                            size="xs"
                            weight="bold"
                        >
                            Discovery blockers
                        </Text>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                            {effectiveDiscoveryBlockers.map((blocker) => (
                                <li key={blocker}>{blocker}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
