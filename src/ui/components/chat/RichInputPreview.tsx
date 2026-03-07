import React, { useMemo } from 'react';

import { AtSign, Hash } from 'lucide-react';

import type { Emoji } from '@/api/emojis/emojis.types';
import type { Channel, Role, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';
import { resolveApiUrl } from '@/utils/apiUrl';
import { getRoleStyle } from '@/utils/roleColor';
import { parseText } from '@/utils/textParser/parser';
import { type ASTNode, ParserFeature } from '@/utils/textParser/types';

interface RichInputPreviewProps {
    value: string;
    members: ServerMember[];
    roles: Role[];
    channels: Channel[];
    friends: User[];
    customCategories: CustomEmojiCategory[];
}

/**
 * @description Renders a pixel-aligned overlay above the textarea that shows
 * parsed tokens (mentions, emojis, channel links) as styled chips.
 * The overlay is pointer-events: none so all interaction goes to the textarea below.
 */
export const RichInputPreview: React.FC<RichInputPreviewProps> = ({
    value,
    members,
    roles,
    channels,
    friends,
    customCategories,
}) => {
    const nodes = useMemo(
        () =>
            parseText(value, {
                features: [
                    ParserFeature.MENTION,
                    ParserFeature.ROLE_MENTION,
                    ParserFeature.EVERYONE_MENTION,
                    ParserFeature.EMOJI,
                    ParserFeature.UNICODE_EMOJI,
                    ParserFeature.CHANNEL_LINK,
                ],
            }),
        [value],
    );

    // Build lookup maps from already-loaded data (no extra API calls needed)
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        members.forEach((m) => map.set(m.user._id, m.user));
        friends.forEach((f) => {
            if (!map.has(f._id)) map.set(f._id, f);
        });
        return map;
    }, [members, friends]);

    const roleMap = useMemo(() => {
        const map = new Map<string, Role>();
        roles.forEach((r) => map.set(r._id, r));
        return map;
    }, [roles]);

    const channelMap = useMemo(() => {
        const map = new Map<string, Channel>();
        channels.forEach((c) => map.set(c._id, c));
        return map;
    }, [channels]);

    const emojiMap = useMemo(() => {
        const map = new Map<string, Emoji>();
        customCategories.forEach((cat) => {
            cat.emojis.forEach((e) => {
                map.set(e.id, {
                    _id: e.id,
                    name: e.name,
                    imageUrl: e.url,
                    serverId: cat.id,
                    createdBy: '',
                    createdAt: '',
                });
            });
        });
        return map;
    }, [customCategories]);

    if (!value) return null;

    return (
        <div
            aria-hidden
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                /* Match TextArea's px-3 py-2 padding + the textarea's py-2 override */
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'flex-start',
            }}
        >
            <span
                style={{
                    display: 'block',
                    width: '100%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                }}
            >
                {nodes.map((node, idx) =>
                    renderNode(node, idx, {
                        userMap,
                        roleMap,
                        channelMap,
                        emojiMap,
                    }),
                )}
            </span>
        </div>
    );
};

interface RenderContext {
    userMap: Map<string, User>;
    roleMap: Map<string, Role>;
    channelMap: Map<string, Channel>;
    emojiMap: Map<string, Emoji>;
}

function renderNode(
    node: ASTNode,
    idx: number,
    ctx: RenderContext,
): React.ReactNode {
    switch (node.type) {
        case 'text':
            // Render empty string as zero-width space to preserve line heights
            return (
                <span key={idx} style={{ color: 'var(--color-foreground)' }}>
                    {node.content}
                </span>
            );

        case 'unicode_emoji':
            return (
                <span key={idx} style={{ color: 'var(--color-foreground)' }}>
                    {node.content}
                </span>
            );

        case 'mention': {
            const user = ctx.userMap.get(node.userId);
            const name = user
                ? (user.displayName ?? user.username)
                : `${node.userId}`;
            return (
                <span
                    className="inline-flex items-baseline px-1.5 rounded bg-primary/15 text-primary font-medium"
                    key={idx}
                    style={{ verticalAlign: 'baseline' }}
                >
                    @{name}
                </span>
            );
        }

        case 'role_mention': {
            const role = ctx.roleMap.get(node.roleId);
            const name = role ? role.name : `${node.roleId}`;
            const style = getRoleStyle(role);
            return (
                <span
                    className="inline-flex items-center gap-0.5 whitespace-nowrap px-1 rounded font-medium text-white shadow-sm"
                    key={idx}
                    style={{ ...style, verticalAlign: 'baseline' }}
                >
                    <AtSign
                        size={12}
                        style={{ display: 'inline', verticalAlign: 'middle' }}
                    />
                    {name}
                </span>
            );
        }

        case 'everyone':
            return (
                <span
                    className="inline-flex items-baseline px-1.5 rounded bg-primary font-medium text-white shadow-sm"
                    key={idx}
                    style={{ verticalAlign: 'baseline' }}
                >
                    @everyone
                </span>
            );

        case 'emoji': {
            const emoji = ctx.emojiMap.get(node.emojiId);
            if (!emoji?.imageUrl) {
                // Fall back to raw text if emoji not found
                return (
                    <span
                        key={idx}
                        style={{ color: 'var(--color-foreground)' }}
                    >
                        {`<emoji:${node.emojiId}>`}
                    </span>
                );
            }
            return (
                <img
                    alt={`:${emoji.name}:`}
                    className="inline-block align-text-bottom"
                    key={idx}
                    src={resolveApiUrl(emoji.imageUrl) || ''}
                    style={{ width: '1.15em', height: '1.15em' }}
                    title={`:${emoji.name}:`}
                />
            );
        }

        case 'channel_link': {
            const channel = ctx.channelMap.get(node.channelId);
            const name = channel ? channel.name : node.channelId;
            return (
                <span
                    className="inline-flex items-center gap-0.5 whitespace-nowrap px-1 rounded bg-primary/15 text-primary font-medium"
                    key={idx}
                    style={{ verticalAlign: 'baseline' }}
                >
                    <Hash
                        size={12}
                        style={{ display: 'inline', verticalAlign: 'middle' }}
                    />
                    {name}
                </span>
            );
        }

        default:
            // For any unrecognized node types (shouldn't happen with our feature set),
            // fall back to rendering the raw content if available
            if ('content' in node && typeof node.content === 'string') {
                return (
                    <span
                        key={idx}
                        style={{ color: 'var(--color-foreground)' }}
                    >
                        {node.content}
                    </span>
                );
            }
            return null;
    }
}
