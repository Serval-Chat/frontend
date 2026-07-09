import type { RolePermissions } from '@/api/servers/servers.types';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';

interface PermissionToggleProps {
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    danger?: boolean;
}

const PermissionToggle = ({
    label,
    description,
    value,
    onChange,
    danger,
}: PermissionToggleProps) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex-1 pr-4">
            <Text
                as="p"
                variant={danger ? 'danger' : 'default'}
                weight="semibold"
            >
                {label}
            </Text>
            <Text as="p" leading="snug" size="xs" variant="muted">
                {description}
            </Text>
        </div>
        <Toggle checked={value} onCheckedChange={onChange} />
    </div>
);

interface RolePermissionsSectionProps {
    permissions: Partial<RolePermissions>;
    onChange: (key: keyof RolePermissions, value: boolean) => void;
}

export const RolePermissionsSection = ({
    permissions,
    onChange,
}: RolePermissionsSectionProps): React.ReactNode => (
    <section className="space-y-4 border-t border-border-subtle pt-4">
        <Heading level={2}>Permissions</Heading>
        <div className="space-y-4">
            <PermissionToggle
                danger
                description="Gives all permissions. This is a dangerous permission to grant."
                label="Administrator"
                value={permissions.administrator || false}
                onChange={(val): void => {
                    onChange('administrator', val);
                }}
            />
            <PermissionToggle
                description="Allows member to change server name, region, or icon."
                label="Manage Server"
                value={permissions.manageServer || false}
                onChange={(val): void => {
                    onChange('manageServer', val);
                }}
            />
            <PermissionToggle
                description="Allows member to create, edit, or delete roles below them."
                label="Manage Roles"
                value={permissions.manageRoles || false}
                onChange={(val): void => {
                    onChange('manageRoles', val);
                }}
            />
            <PermissionToggle
                description="Allows member to create, edit, or delete channels."
                label="Manage Channels"
                value={permissions.manageChannels || false}
                onChange={(val): void => {
                    onChange('manageChannels', val);
                }}
            />
            <PermissionToggle
                description="Allows member to invite new people by creating regular invite links."
                label="Invite Users"
                value={permissions.inviteUsers !== false}
                onChange={(val): void => {
                    onChange('inviteUsers', val);
                }}
            />
            <PermissionToggle
                description="Allows member to create, view, and delete all invite links, including custom vanity invites."
                label="Manage Invites"
                value={permissions.manageInvites || false}
                onChange={(val): void => {
                    onChange('manageInvites', val);
                }}
            />
            <PermissionToggle
                danger
                description="Allows member to kick other members."
                label="Kick Members"
                value={permissions.kickMembers || false}
                onChange={(val): void => {
                    onChange('kickMembers', val);
                }}
            />
            <PermissionToggle
                danger
                description="Allows member to ban other members."
                label="Ban Members"
                value={permissions.banMembers || false}
                onChange={(val): void => {
                    onChange('banMembers', val);
                }}
            />
            <PermissionToggle
                danger
                description="Allows member to timeout other members."
                label="Moderate Members"
                value={permissions.moderateMembers || false}
                onChange={(val): void => {
                    onChange('moderateMembers', val);
                }}
            />
            <PermissionToggle
                description="Allows member to view channels."
                label="View Channels"
                value={permissions.viewChannels !== false}
                onChange={(val): void => {
                    onChange('viewChannels', val);
                }}
            />
            <PermissionToggle
                description="Allows member to connect to voice channels."
                label="Connect"
                value={permissions.connect !== false}
                onChange={(val): void => {
                    onChange('connect', val);
                }}
            />
            <PermissionToggle
                description="Allows member to send messages in text channels."
                label="Send Messages"
                value={permissions.sendMessages !== false}
                onChange={(val): void => {
                    onChange('sendMessages', val);
                }}
            />
            <PermissionToggle
                description="Allows member to delete messages by other members."
                label="Manage Messages"
                value={permissions.manageMessages || false}
                onChange={(val): void => {
                    onChange('manageMessages', val);
                }}
            />
            <PermissionToggle
                description="Allows member to pin or unpin messages."
                label="Pin Messages"
                value={permissions.pinMessages || false}
                onChange={(val): void => {
                    onChange('pinMessages', val);
                }}
            />
            <PermissionToggle
                description="Allows member to add new reactions to messages."
                label="Add Reactions"
                value={permissions.addReactions !== false}
                onChange={(val): void => {
                    onChange('addReactions', val);
                }}
            />
            <PermissionToggle
                description="Allows member to remove reactions added by other members."
                label="Manage Reactions"
                value={permissions.manageReactions || false}
                onChange={(val): void => {
                    onChange('manageReactions', val);
                }}
            />
            <PermissionToggle
                description="Allows member to upload, edit, and delete server stickers."
                label="Manage Stickers"
                value={permissions.manageStickers || false}
                onChange={(val): void => {
                    onChange('manageStickers', val);
                }}
            />
            <PermissionToggle
                description="Allows member to use @everyone and @here to notify all members."
                label="Mention @everyone"
                value={permissions.pingRolesAndEveryone || false}
                onChange={(val): void => {
                    onChange('pingRolesAndEveryone', val);
                }}
            />
            <PermissionToggle
                description="Allows member to see messages that have been deleted (rendered in red)."
                label="See Deleted Messages"
                value={permissions.seeDeletedMessages || false}
                onChange={(val): void => {
                    onChange('seeDeletedMessages', val);
                }}
            />
            <PermissionToggle
                description="Allows member to render markdown even when disallowed markdown features are configured."
                label="Bypass Markdown Restrictions"
                value={permissions.bypassMarkdownRestrictions || false}
                onChange={(val): void => {
                    onChange('bypassMarkdownRestrictions', val);
                }}
            />
        </div>
    </section>
);
