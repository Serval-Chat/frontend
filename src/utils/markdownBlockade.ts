import type {
    Category,
    Channel,
    MarkdownBlockadeRule,
    Role,
    Server,
    ServerMember,
} from '@/api/servers/servers.types';
import { ParserPresets } from '@/utils/textParser/parser';
import {
    ParserFeature,
    type ParserFeature as ParserFeatureType,
} from '@/utils/textParser/types';

export const MARKDOWN_FEATURE_OPTIONS: {
    id: ParserFeatureType;
    label: string;
}[] = [
    { id: ParserFeature.BOLD, label: 'Bold' },
    { id: ParserFeature.ITALIC, label: 'Italic' },
    { id: ParserFeature.BOLD_ITALIC, label: 'Bold italic' },
    { id: ParserFeature.UNDERLINE, label: 'Underline' },
    { id: ParserFeature.STRIKETHROUGH, label: 'Strikethrough' },
    { id: ParserFeature.SPOILER, label: 'Spoilers' },
    { id: ParserFeature.INLINE_CODE, label: 'Inline code' },
    { id: ParserFeature.CODE_BLOCK, label: 'Code blocks' },
    { id: ParserFeature.LINK, label: 'Links' },
    { id: ParserFeature.H1, label: 'Heading 1' },
    { id: ParserFeature.H2, label: 'Heading 2' },
    { id: ParserFeature.H3, label: 'Heading 3' },
    { id: ParserFeature.SUBTEXT, label: 'Subtext' },
    { id: ParserFeature.BLOCKQUOTE, label: 'Blockquotes' },
    { id: ParserFeature.ORDERED_LIST, label: 'Ordered lists' },
    { id: ParserFeature.UNORDERED_LIST, label: 'Unordered lists' },
    { id: ParserFeature.CHECKLIST, label: 'Checklists' },
    { id: ParserFeature.TABLE, label: 'Tables' },
    { id: ParserFeature.LATEX, label: 'LaTeX blocks' },
    { id: ParserFeature.INLINE_LATEX, label: 'Inline LaTeX' },
    { id: ParserFeature.MERMAID, label: 'Mermaid' },
    { id: ParserFeature.ADMONITION, label: 'Admonitions' },
    { id: ParserFeature.THEMATIC_BREAK, label: 'Dividers' },
    { id: ParserFeature.SUPERSCRIPT, label: 'Superscript' },
    { id: ParserFeature.SUBSCRIPT, label: 'Subscript' },
    { id: ParserFeature.STACKED_SCRIPT, label: 'Stacked script' },
];

const featureLabels = new Map(
    MARKDOWN_FEATURE_OPTIONS.map((feature): [ParserFeature, string] => [
        feature.id,
        feature.label,
    ]),
);

const ruleMatchesSender = (
    rule: MarkdownBlockadeRule,
    senderId?: string,
    senderMember?: ServerMember,
    senderRoles?: Role[],
): boolean => {
    if (rule.targetType === 'everyone') return true;
    if (rule.targetType === 'user') return rule.targetId === senderId;
    if (rule.targetType === 'role') {
        return (
            senderMember?.roles.includes(rule.targetId) === true ||
            senderRoles?.some((role): boolean => role.id === rule.targetId) ===
                true
        );
    }
    return false;
};

const getRuleSpecificity = (
    rule: MarkdownBlockadeRule,
    senderId?: string,
    senderMember?: ServerMember,
    senderRoles?: Role[],
): number => {
    if (!ruleMatchesSender(rule, senderId, senderMember, senderRoles)) {
        return -1;
    }
    if (rule.targetType === 'user') return 3;
    if (rule.targetType === 'role') return 2;
    return 1;
};

const hasBypassMarkdownRestrictions = (params: {
    server?: Server;
    category?: Category;
    channel?: Channel;
    senderId?: string;
    senderRoles?: Role[];
}): boolean => {
    if (
        params.server?.ownerId !== undefined &&
        params.senderId !== undefined &&
        params.server.ownerId === params.senderId
    ) {
        return true;
    }

    if (
        params.senderRoles?.some(
            (role): boolean =>
                role.permissions?.administrator === true ||
                role.permissions?.bypassMarkdownRestrictions === true,
        ) === true
    ) {
        return true;
    }

    const getOverride = (
        overrides?: Record<string, Record<string, boolean>>,
    ): boolean | undefined => {
        if (!overrides) return undefined;
        let hasDeny = false;

        for (const role of params.senderRoles ?? []) {
            const roleOverride = overrides[role.id];
            const value = roleOverride?.bypassMarkdownRestrictions;
            if (value === true) return true;
            if (value === false) hasDeny = true;
        }

        const everyoneOverride = overrides.everyone;
        const everyoneValue = everyoneOverride?.bypassMarkdownRestrictions;
        if (everyoneValue === true) return true;
        if (everyoneValue === false) hasDeny = true;

        return hasDeny ? false : undefined;
    };

    const channelOverride = getOverride(params.channel?.permissions);
    if (channelOverride !== undefined) return channelOverride;

    const categoryOverride = getOverride(params.category?.permissions);
    if (categoryOverride !== undefined) return categoryOverride;

    return false;
};

export const getBlockedMarkdownFeatures = (params: {
    server?: Server;
    category?: Category;
    channel?: Channel;
    senderId?: string;
    senderMember?: ServerMember;
    senderRoles?: Role[];
}): ParserFeatureType[] => {
    if (hasBypassMarkdownRestrictions(params)) return [];

    const blocked = new Set<ParserFeatureType>();
    const ruleGroups = [
        params.server?.markdownBlockadeRules,
        params.category?.markdownBlockadeRules,
        params.channel?.markdownBlockadeRules,
    ];

    for (const rules of ruleGroups) {
        let mostSpecificRules: MarkdownBlockadeRule[] = [];
        let highestSpecificity = -1;

        for (const rule of rules ?? []) {
            const specificity = getRuleSpecificity(
                rule,
                params.senderId,
                params.senderMember,
                params.senderRoles,
            );
            if (specificity > highestSpecificity) {
                highestSpecificity = specificity;
                mostSpecificRules = [rule];
            } else if (specificity === highestSpecificity) {
                mostSpecificRules.push(rule);
            }
        }

        for (const rule of mostSpecificRules) {
            if (highestSpecificity > 0) {
                rule.features.forEach(
                    (feature): Set<ParserFeature> => blocked.add(feature),
                );
            }
        }
    }

    return [...blocked];
};

export const getAllowedMessageFeatures = (
    blockedFeatures: readonly ParserFeatureType[],
): ParserFeatureType[] => {
    const blocked = new Set(blockedFeatures);
    return ParserPresets.MESSAGE.features.filter(
        (feature): boolean => !blocked.has(feature),
    );
};

export const formatBlockedMarkdownFeatures = (
    features: readonly ParserFeatureType[],
): string =>
    features
        .map((feature): string => featureLabels.get(feature) ?? feature)
        .sort((a, b): number => a.localeCompare(b))
        .join(', ');
