import type { MessageAttachment } from '@/api/chat/chat.types';
import type { ChatMessage } from '@/api/chat/chat.types';
import { apiClient } from '@/api/client';
import type {
    Badge,
    PrivacySettings,
    UserConnection,
    UsernameFont,
    UsernameGlow,
    UsernameGradient,
} from '@/api/users/users.types';
import type { ButtonComponent, Embed } from '@/types/embed';
import type { PresenceStatus } from '@/types/presence';

export type ReportReason = string;
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportTargetType = 'message' | 'user';

export type ReportMessageEditRevision =
    | {
          start: number;
          removedText: string;
          insertedText: string;
          editedAt: string;
      }
    | {
          text: string;
          editedAt: string;
      };

export interface ReportMessageSnapshot {
    text: string;
    isPartialSnapshot?: boolean;
    createdAt?: string;
    editedAt?: string;
    deletedAt?: string;
    isEdited?: boolean;
    editHistory?: ReportMessageEditRevision[];
    isWebhook?: boolean;
    webhookUsername?: string;
    reply?: {
        id: string;
        senderId: string;
        text: string;
    };
    attachments?: MessageAttachment[];
    embeds?: Embed[];
    components?: ButtonComponent[];
    poll?: {
        title: string;
        options: {
            id: string;
            text: string;
            emoji?: string;
            emojiType?: 'unicode' | 'custom';
            emojiId?: string;
            votes: number;
        }[];
        multiSelect: boolean;
        expiresAt?: string;
    };
    stickerId?: string;
    interaction?: ChatMessage['interaction'];
}

export interface ReportMessageContextEntry extends ReportMessageSnapshot {
    id: string;
    senderId: string;
    senderUsername?: string;
    isTarget: boolean;
}

export interface ReportReasonOption {
    id: string;
    targetType: ReportTargetType;
    label: string;
    subcategories: ReportSubcategoryOption[];
}

export interface ReportSubcategoryOption {
    id: string;
    label: string;
}

export interface AdminReportReasonOption extends ReportReasonOption {
    enabled: boolean;
    position: number;
    subcategories: AdminReportSubcategoryOption[];
}

export interface AdminReportSubcategoryOption extends ReportSubcategoryOption {
    enabled: boolean;
    position: number;
}

export interface AdminReportReasonOptionInput {
    id?: string;
    targetType: ReportTargetType;
    label: string;
    enabled: boolean;
    subcategories: {
        id?: string;
        label: string;
        enabled: boolean;
    }[];
}

export interface AdminReportReasonOptionDeletions {
    deleteReasonIds: string[];
    deleteSubcategoryIds: string[];
}

export interface ReportRecord {
    id: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    reasonLabel?: string;
    subReason?: string;
    subReasonLabel?: string;
    status: ReportStatus;
    createdAt: string;
}

export interface ReportUserProfileSnapshot {
    username: string;
    displayName?: string | null;
    bio?: string;
    pronouns?: string;
    usernameFont?: UsernameFont;
    usernameGradient?: UsernameGradient;
    usernameGlow?: UsernameGlow;
    customStatus?: { text: string; emoji?: string };
    presenceStatus?: PresenceStatus;
    isBot?: boolean;
    botVerified?: boolean;
    decorationId?: string;
    badges?: Badge[];
    privacySettings?: PrivacySettings;
    connections?: UserConnection[];
    bannerColor?: string;
    profilePrimaryColor?: string;
    profileAccentColor?: string;
    createdAt?: string;
    profilePictureAvailable?: boolean;
    bannerAvailable?: boolean;
}

export type ReportSubmissionResponse = Omit<ReportRecord, 'status'>;

export interface StaffReport extends ReportRecord {
    reportCount?: number;
    reporterId: string;
    reporterUsername?: string;
    details?: string;
    serverId?: string;
    channelId?: string;
    targetUsername?: string;
    targetUserId?: string;
    messageSnapshot?: string;
    messageContext?: ReportMessageContextEntry[];
    messageContent?: ReportMessageSnapshot;
    userProfileSnapshot?: ReportUserProfileSnapshot;
    internalNote?: string;
    reviewedBy?: string;
}

export const reportsApi = {
    options: (targetType: ReportTargetType) =>
        apiClient
            .get<ReportReasonOption[]>('/api/v1/reports/options', {
                params: { targetType },
            })
            .then((r) => r.data),
    adminOptions: () =>
        apiClient
            .get<AdminReportReasonOption[]>('/api/v1/admin/reports/options')
            .then((r) => r.data),
    updateOptions: (
        options: AdminReportReasonOptionInput[],
        deletions?: AdminReportReasonOptionDeletions,
    ) =>
        apiClient
            .put<AdminReportReasonOption[]>('/api/v1/admin/reports/options', {
                options,
                ...deletions,
            })
            .then((r) => r.data),
    create: (payload: {
        targetType: ReportTargetType;
        targetId: string;
        reason: ReportReason;
        subReason?: string;
        details?: string;
    }) =>
        apiClient
            .post<ReportSubmissionResponse>('/api/v1/reports', payload)
            .then((r) => r.data),
    mine: () =>
        apiClient.get<ReportRecord[]>('/api/v1/reports/me').then((r) => r.data),
    staffList: (params: {
        status?: ReportStatus;
        reportId?: string;
        limit?: number;
        offset?: number;
    }) =>
        apiClient
            .get<StaffReport[]>('/api/v1/admin/reports', { params })
            .then((r) => r.data),
    update: (
        id: string,
        payload: { status: ReportStatus; internalNote?: string },
    ) =>
        apiClient
            .patch<StaffReport>(`/api/v1/admin/reports/${id}`, payload)
            .then((r) => r.data),
    snapshotImage: (reportId: string, kind: 'avatar' | 'banner') =>
        apiClient
            .get<Blob>(
                `/api/v1/admin/reports/${encodeURIComponent(reportId)}/profile-image/${kind}`,
                { responseType: 'blob' },
            )
            .then((r) => r.data),
};
