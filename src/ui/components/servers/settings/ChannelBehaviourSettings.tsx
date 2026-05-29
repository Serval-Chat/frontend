import { useUpdateChannel } from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

import { MarkdownBlockadeSettings } from './MarkdownBlockadeSettings';

interface ChannelBehaviourSettingsProps {
    channel: Channel;
}

export const ChannelBehaviourSettings = ({
    channel,
}: ChannelBehaviourSettingsProps) => {
    const { mutate: updateChannel, isPending } = useUpdateChannel(
        channel.serverId,
        channel._id,
    );

    return (
        <div className="max-w-3xl space-y-10 pb-20">
            <div>
                <Heading className="mb-1" level={2} variant="section">
                    Channel Behaviour
                </Heading>
                <Text variant="muted">
                    Configure visual markdown rendering rules for this channel.
                </Text>
            </div>
            <MarkdownBlockadeSettings
                isPending={isPending}
                rules={channel.markdownBlockadeRules}
                serverId={channel.serverId}
                onSave={(markdownBlockadeRules): void =>
                    updateChannel({ markdownBlockadeRules })
                }
            />
        </div>
    );
};
