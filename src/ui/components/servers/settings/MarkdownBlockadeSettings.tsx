import React, { useMemo, useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { useMembers, useRoles } from '@/api/servers/servers.queries';
import type {
    MarkdownBlockadeRule,
    Role,
    ServerMember,
} from '@/api/servers/servers.types';
import { Button } from '@/ui/components/common/Button';
import { DropdownWithSearch } from '@/ui/components/common/DropdownWithSearch';
import { RoleDot } from '@/ui/components/common/RoleDot';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';
import { Toggle } from '@/ui/components/common/Toggle';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import {
    MARKDOWN_FEATURE_OPTIONS,
    formatBlockedMarkdownFeatures,
} from '@/utils/markdownBlockade';
import type { ParserFeature } from '@/utils/textParser/types';

interface MarkdownBlockadeSettingsProps {
    rules?: MarkdownBlockadeRule[];
    serverId: string;
    isPending: boolean;
    onSave: (rules: MarkdownBlockadeRule[]) => void;
}

type DraftMarkdownBlockadeRule = MarkdownBlockadeRule & {
    draftId: string;
};

let nextDraftRuleId = 0;

const makeRule = (): MarkdownBlockadeRule => ({
    targetType: 'everyone',
    targetId: 'everyone',
    features: [],
});

const makeDraftRule = (
    rule: MarkdownBlockadeRule = makeRule(),
): DraftMarkdownBlockadeRule => ({
    ...rule,
    draftId: `markdown-blockade-rule-${nextDraftRuleId++}`,
});

const stripDraftRule = (
    draftRule: DraftMarkdownBlockadeRule,
): MarkdownBlockadeRule => ({
    targetType: draftRule.targetType,
    targetId: draftRule.targetId,
    features: draftRule.features,
});

const ruleTargetValue = (rule: MarkdownBlockadeRule): string =>
    rule.targetType === 'everyone'
        ? 'everyone'
        : `${rule.targetType}:${rule.targetId}`;

const parseTargetValue = (
    value: string | null,
): Pick<MarkdownBlockadeRule, 'targetType' | 'targetId'> => {
    if (!value || value === 'everyone') {
        return { targetType: 'everyone', targetId: 'everyone' };
    }
    const [targetType, targetId] = value.split(':', 2);
    if (targetType === 'user' || targetType === 'role') {
        return { targetType, targetId };
    }
    return { targetType: 'everyone', targetId: 'everyone' };
};

export const MarkdownBlockadeSettings: React.FC<
    MarkdownBlockadeSettingsProps
> = ({ rules = [], serverId, isPending, onSave }) => {
    const [draftRules, setDraftRules] = useState<DraftMarkdownBlockadeRule[]>(
        () => rules.map(makeDraftRule),
    );
    const [originalRules, setOriginalRules] = useState<
        DraftMarkdownBlockadeRule[]
    >(() => rules.map(makeDraftRule));
    const { data: roles = [] } = useRoles(serverId);
    const { data: members = [] } = useMembers(serverId);

    const targetOptions = useMemo(() => {
        const roleOptions = roles.map((role: Role) => ({
            id: `role:${role._id}`,
            label: role.name,
            icon: <RoleDot role={role} />,
            description: 'Role',
        }));
        const memberOptions = members.map((member: ServerMember) => ({
            id: `user:${member.userId}`,
            label: member.user.username,
            icon: (
                <UserProfilePicture
                    noIndicator
                    size="xs"
                    src={member.user.profilePicture}
                    username={member.user.displayName || member.user.username}
                />
            ),
            description: 'User',
        }));
        return [
            {
                id: 'everyone',
                label: '@everyone',
                description: 'All members',
            },
            ...roleOptions,
            ...memberOptions,
        ];
    }, [members, roles]);

    const hasChanges =
        JSON.stringify(draftRules.map(stripDraftRule)) !==
        JSON.stringify(originalRules.map(stripDraftRule));

    const updateRule = (
        index: number,
        updater: (rule: DraftMarkdownBlockadeRule) => DraftMarkdownBlockadeRule,
    ): void => {
        setDraftRules((current) =>
            current.map((rule, i) => (i === index ? updater(rule) : rule)),
        );
    };

    const handleSave = (): void => {
        onSave(draftRules.map(stripDraftRule));
        setOriginalRules(draftRules);
    };

    return (
        <div className="space-y-6 border-t border-border-subtle pt-6">
            <div className="space-y-1">
                <Text as="p" weight="semibold">
                    Disallowed Markdown Features
                </Text>
                <Text as="p" size="xs" variant="muted">
                    Hide selected markdown rendering for roles, users, or
                    @everyone. Messages still send normally.
                </Text>
            </div>

            <div className="space-y-4">
                {draftRules.map((rule, index) => (
                    <div
                        className="space-y-4 rounded-lg border border-border-subtle p-4"
                        key={rule.draftId}
                    >
                        <div className="flex items-start gap-3">
                            <DropdownWithSearch
                                allowClear={false}
                                options={targetOptions}
                                placeholder="Select target"
                                searchPlaceholder="Search targets..."
                                value={ruleTargetValue(rule)}
                                onChange={(value) =>
                                    updateRule(index, (current) => ({
                                        ...current,
                                        ...parseTargetValue(value),
                                    }))
                                }
                            />
                            <Button
                                aria-label="Remove disallowed markdown feature rule"
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    setDraftRules((current) =>
                                        current.filter((_, i) => i !== index),
                                    )
                                }
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {MARKDOWN_FEATURE_OPTIONS.map((feature) => (
                                <label
                                    className="flex items-center justify-between gap-3 rounded-md bg-bg-secondary px-3 py-2"
                                    key={feature.id}
                                >
                                    <Text size="sm">{feature.label}</Text>
                                    <Toggle
                                        checked={rule.features.includes(
                                            feature.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            updateRule(index, (current) => ({
                                                ...current,
                                                features: checked
                                                    ? [
                                                          ...current.features,
                                                          feature.id,
                                                      ]
                                                    : current.features.filter(
                                                          (item) =>
                                                              item !==
                                                              feature.id,
                                                      ),
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>

                        {rule.features.length > 0 && (
                            <Text size="xs" variant="muted">
                                Disallowed:{' '}
                                {formatBlockedMarkdownFeatures(
                                    rule.features as ParserFeature[],
                                )}
                            </Text>
                        )}
                    </div>
                ))}
            </div>

            <Button
                icon={Plus}
                type="button"
                variant="normal"
                onClick={() =>
                    setDraftRules((current) => [...current, makeDraftRule()])
                }
            >
                Add disallowed features
            </Button>

            <SettingsFloatingBar
                isPending={isPending}
                isVisible={hasChanges}
                onReset={() => setDraftRules(originalRules)}
                onSave={handleSave}
            />
        </div>
    );
};
