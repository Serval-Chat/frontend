import { useState } from 'react';

import { AlertCircle, CheckCircle2, Trash2, Upload } from 'lucide-react';

import type { Role, RolePermissions } from '@/api/servers/servers.types';
import { RoleDot } from '@/features/servers/RoleDot';
import { Button } from '@/ui/primitives/Button';
import { Modal } from '@/ui/primitives/Modal';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';
import { Tooltip } from '@/ui/primitives/Tooltip';
import {
    type ExportedRole,
    type ExportedRoleEntry,
    type ExportedRoleList,
    type RoleExportPayload,
    importRolePayload,
} from '@/utils/roleExport';

export interface RoleImportResult {
    role: Omit<Role, 'id' | 'serverId' | 'position'> & {
        permissions?: RolePermissions;
    };
}

export interface RoleListImportResult {
    roles: RoleImportResult['role'][];
}

interface RoleImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportRole?: (result: RoleImportResult) => void;
    onImportRoleList?: (result: RoleListImportResult) => void;
}

function entryToRole(
    entry: ExportedRole | ExportedRoleEntry,
): RoleImportResult['role'] {
    return {
        name: entry.name,
        color: entry.color ?? null,
        startColor: entry.startColor,
        endColor: entry.endColor,
        colors: entry.colors,
        gradientRepeat: entry.gradientRepeat,
        glowEnabled: entry.glowEnabled,
        separateFromOtherRoles: entry.separateFromOtherRoles,
        description: entry.description,
        permissions: entry.permissions as RolePermissions | undefined,
    };
}

function getModPermissionsSummary(
    permissions?: Partial<RolePermissions>,
): string[] {
    if (!permissions) return [];
    const keys: { key: keyof RolePermissions; label: string }[] = [
        { key: 'banMembers', label: 'Ban members' },
        { key: 'kickMembers', label: 'Kick members' },
        { key: 'moderateMembers', label: 'Timeout/Moderate members' },
        { key: 'manageMessages', label: 'Manage messages' },
        { key: 'deleteMessagesOfOthers', label: 'Delete messages' },
        { key: 'manageRoles', label: 'Manage roles' },
        { key: 'manageChannels', label: 'Manage channels' },
        { key: 'manageServer', label: 'Manage server' },
    ];
    return keys.filter((k) => Boolean(permissions[k.key])).map((k) => k.label);
}

function RoleEntryPreview({
    entry,
    index,
    onRemove,
}: {
    entry: ExportedRole | ExportedRoleEntry;
    index?: number;
    onRemove?: () => void;
}): React.ReactNode {
    const modPermissions = !entry.permissions?.administrator
        ? getModPermissionsSummary(entry.permissions)
        : [];

    return (
        <div className="group flex items-center gap-2 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm">
            {index !== undefined && (
                <Text
                    align="right"
                    className="w-5 shrink-0"
                    size="xs"
                    variant="muted"
                >
                    #{index + 1}
                </Text>
            )}
            <RoleDot role={entry as unknown as Role} size={12} />
            <Text className="flex-1 truncate" variant="default" weight="medium">
                {entry.name}
            </Text>
            {entry.separateFromOtherRoles && (
                <Tooltip
                    content="Display role members separately from online members"
                    position="top"
                >
                    <Text
                        className="shrink-0 rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-400"
                        tracking="wider"
                        weight="semibold"
                    >
                        HOISTED
                    </Text>
                </Tooltip>
            )}
            {entry.permissions?.administrator && (
                <Tooltip
                    content="Grants all permissions and bypasses channel restrictions"
                    position="top"
                >
                    <Text
                        className="shrink-0 rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400"
                        tracking="wider"
                        weight="semibold"
                    >
                        ADMIN
                    </Text>
                </Tooltip>
            )}
            {!entry.permissions?.administrator && modPermissions.length > 0 && (
                <Tooltip
                    multiline
                    content={`Moderator abilities:\n${modPermissions
                        .map((perm, i) => `${i + 1}. ${perm}`)
                        .join('\n')}`}
                    position="top"
                >
                    <Text
                        className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400"
                        tracking="wider"
                        weight="semibold"
                    >
                        MOD
                    </Text>
                </Tooltip>
            )}
            {onRemove && (
                <Tooltip content="Remove from import" position="top">
                    <Pressable
                        aria-label="Remove from import"
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                        onClick={onRemove}
                    >
                        <Trash2 size={14} />
                    </Pressable>
                </Tooltip>
            )}
        </div>
    );
}

export const RoleImportModal = ({
    isOpen,
    onClose,
    onImportRole,
    onImportRoleList,
}: RoleImportModalProps): React.ReactNode => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<RoleExportPayload | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleClose = (): void => {
        setCode('');
        setError(null);
        setParsed(null);
        onClose();
    };

    const handleParse = async (): Promise<void> => {
        setError(null);
        setParsed(null);
        setIsParsing(true);
        try {
            const result = await importRolePayload(code);
            setParsed(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error.');
        } finally {
            setIsParsing(false);
        }
    };

    const handleApply = (): void => {
        if (!parsed) return;

        if (parsed._type === 'role') {
            onImportRole?.({ role: entryToRole(parsed) });
        } else {
            const list = parsed as ExportedRoleList;
            onImportRoleList?.({
                roles: list.roles.map((e) => entryToRole(e)),
            });
        }
        handleClose();
    };

    const isList = parsed?._type === 'role-list';
    const roleList = isList ? (parsed as ExportedRoleList).roles : null;

    const handleRemoveRole = (index: number): void => {
        if (!parsed || parsed._type !== 'role-list') return;
        const list = parsed as ExportedRoleList;
        const nextRoles = list.roles.filter((_, i) => i !== index);
        setParsed({
            ...list,
            roles: nextRoles,
        });
    };

    return (
        <Modal
            className="flex max-h-[75vh] max-w-xl flex-col"
            isOpen={isOpen}
            title="Import Role"
            onClose={handleClose}
        >
            <div className="flex max-h-full flex-col overflow-hidden px-1">
                {!parsed && (
                    <div className="flex flex-col gap-4">
                        <Text as="p" size="sm" variant="muted">
                            Paste a role export code below.
                        </Text>

                        <div className="flex flex-col gap-1.5">
                            <Text
                                as="label"
                                className="text-xs font-semibold text-muted-foreground"
                                htmlFor="role-import-code"
                            >
                                Export code
                            </Text>
                            <TextArea
                                autoResize={false}
                                id="role-import-code"
                                placeholder="Paste export code here…"
                                spellCheck={false}
                                textareaClassName="min-h-[100px] max-h-none resize-y font-mono text-xs placeholder:text-muted-foreground"
                                value={code}
                                onChange={(e): void => {
                                    setCode(e.target.value);
                                    setParsed(null);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                        <AlertCircle className="mt-0.5 shrink-0" size={14} />
                        <Text>{error}</Text>
                    </div>
                )}

                {/* Preview */}
                {parsed && (
                    <div className="flex min-h-0 flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
                            <CheckCircle2 size={14} />
                            {isList
                                ? `Role list (${roleList?.length ?? 0} roles)`
                                : 'Single role'}
                        </div>

                        <div className="custom-scrollbar flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto pr-1">
                            {isList ? (
                                roleList?.length ? (
                                    roleList.map((entry, i) => (
                                        <RoleEntryPreview
                                            entry={entry}
                                            index={i}
                                            key={
                                                entry.name
                                                    ? `${entry.name}-${i}`
                                                    : `role-${i}`
                                            }
                                            onRemove={(): void =>
                                                handleRemoveRole(i)
                                            }
                                        />
                                    ))
                                ) : (
                                    <Text
                                        align="center"
                                        as="p"
                                        className="py-4"
                                        size="xs"
                                        variant="muted"
                                    >
                                        No roles selected for import.
                                    </Text>
                                )
                            ) : (
                                <RoleEntryPreview
                                    entry={parsed as ExportedRole}
                                />
                            )}
                        </div>

                        {isList && !!roleList?.length && (
                            <Text
                                as="p"
                                className="shrink-0 pt-1"
                                size="xs"
                                variant="muted"
                            >
                                Importing a role list will create{' '}
                                <strong>{roleList?.length}</strong> new roles in
                                the order shown above. Existing roles will not
                                be affected.
                            </Text>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
                    {parsed && (
                        <Button
                            variant="ghost"
                            onClick={(): void => setParsed(null)}
                        >
                            Back
                        </Button>
                    )}
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    {!parsed ? (
                        <Button
                            disabled={!code.trim() || isParsing}
                            variant="primary"
                            onClick={(): void => {
                                void handleParse();
                            }}
                        >
                            <Upload size={14} />
                            {isParsing ? 'Parsing…' : 'Parse'}
                        </Button>
                    ) : (
                        <Button
                            disabled={isList && !roleList?.length}
                            variant="primary"
                            onClick={handleApply}
                        >
                            <CheckCircle2 size={14} />
                            Apply
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
