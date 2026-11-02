import type {
    ReportMessageContextEntry,
    StaffReport,
} from '@/api/reports/reports.api';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Message } from '@/ui/components/chat/Message';
import { reconstructMessageEditHistory } from '@/utils/reconstructMessageEditHistory';

type MessageSnapshot = NonNullable<StaffReport['messageContent']>;

interface ReportMessagePreviewProps {
    report: StaffReport;
    user: User;
    snapshot?: MessageSnapshot;
    fallbackText?: string;
}

function formatTimestamp(value?: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString();
}

function renderContextMessage(message: ReportMessageContextEntry) {
    const sender = message.senderUsername ?? message.senderId;
    const createdAt = formatTimestamp(message.createdAt);
    const editedAt = formatTimestamp(message.editedAt);
    const editHistory = reconstructMessageEditHistory(
        message.text,
        message.editHistory ?? [],
    );

    return (
        <div
            className="rounded-lg border border-border-subtle p-2"
            key={message.id}
        >
            <div className="mb-1 text-xs text-text-muted">
                {sender}
                {createdAt ? ` · ${createdAt}` : ''}
            </div>
            {editHistory.map((revision) => {
                const editedAt = formatTimestamp(revision.editedAt);
                return (
                    <p
                        className="text-sm break-words whitespace-pre-wrap text-text-muted"
                        key={`${message.id}-revision-${revision.editedAt}-${revision.text}`}
                    >
                        {revision.text}
                        <span className="ml-1 text-xs italic">
                            (edited{editedAt ? ` ${editedAt}` : ''})
                        </span>
                    </p>
                );
            })}
            <p className="text-text-primary text-sm break-words whitespace-pre-wrap">
                {message.text}
                {message.isEdited ? (
                    <span className="ml-1 text-xs text-text-muted italic">
                        (edited{editedAt ? ` ${editedAt}` : ''})
                    </span>
                ) : null}
            </p>
        </div>
    );
}

export const ReportMessagePreview = ({
    report,
    user,
    snapshot,
    fallbackText,
}: ReportMessagePreviewProps) => {
    if (!snapshot && !fallbackText) return null;

    const senderId = report.targetUserId ?? user.id;
    const messageUser =
        snapshot?.isWebhook && snapshot.webhookUsername
            ? { ...user, displayName: snapshot.webhookUsername }
            : user;
    const replyUser = snapshot?.reply
        ? {
              id: snapshot.reply.senderId,
              username: snapshot.reply.senderId,
              createdAt: new Date(report.createdAt),
          }
        : undefined;
    const message: ProcessedChatMessage = {
        id: `report-${report.id}`,
        text: snapshot?.text ?? fallbackText ?? '',
        createdAt: snapshot?.createdAt ?? report.createdAt,
        senderId,
        senderUsername: messageUser.username,
        senderProfilePicture: messageUser.profilePicture ?? null,
        serverId: report.serverId,
        channelId: report.channelId,
        replyToId: snapshot?.reply?.id,
        replyTo:
            snapshot?.reply && replyUser
                ? {
                      id: snapshot.reply.id,
                      user: replyUser,
                      text: snapshot.reply.text,
                  }
                : undefined,
        stickerId: snapshot?.stickerId ?? null,
        isEdited: snapshot?.isEdited ?? false,
        editedAt: snapshot?.editedAt,
        isPinned: false,
        isSticky: false,
        isWebhook: snapshot?.isWebhook ?? false,
        webhookUsername: snapshot?.webhookUsername,
        embeds: snapshot?.embeds ?? [],
        components: snapshot?.components ?? [],
        attachments: snapshot?.attachments ?? [],
        reactions: [],
        interaction: snapshot?.interaction ?? null,
        poll: null,
        senderIsBot: messageUser.isBot ?? false,
        deletedAt: snapshot?.deletedAt,
        user: messageUser,
    };
    const context = report.messageContext ?? [];
    const targetIndex = context.findIndex((entry) => entry.isTarget);
    const beforeTarget =
        targetIndex === -1 ? [] : context.slice(0, targetIndex);
    const afterTarget =
        targetIndex === -1 ? [] : context.slice(targetIndex + 1);
    const targetHistorySource =
        snapshot?.editHistory ?? context[targetIndex]?.editHistory ?? [];
    const targetHistory = reconstructMessageEditHistory(
        snapshot?.text ?? fallbackText ?? context[targetIndex]?.text ?? '',
        targetHistorySource,
    );
    const targetSender =
        context[targetIndex]?.senderUsername ??
        messageUser.displayName ??
        messageUser.username;

    return (
        <section
            aria-label="Reported message"
            className="rounded-xl border border-border-subtle bg-bg-primary p-3"
        >
            {snapshot?.isPartialSnapshot ? (
                <div className="mb-2 text-xs text-text-muted">
                    Older report: saved text with current message details.
                </div>
            ) : null}
            {context.length > 0 ? (
                <section
                    aria-label="Message context at report time"
                    className="flex flex-col gap-2"
                >
                    {beforeTarget.map(renderContextMessage)}
                    {targetHistory.length > 0 ? (
                        <div className="rounded-lg border border-border-subtle bg-bg-secondary p-2">
                            <div className="mb-1 text-xs text-text-muted">
                                Earlier versions of {targetSender}'s reported
                                message
                            </div>
                            {targetHistory.map((revision) => {
                                const editedAt = formatTimestamp(
                                    revision.editedAt,
                                );
                                return (
                                    <p
                                        className="text-sm break-words whitespace-pre-wrap text-text-muted"
                                        key={`target-revision-${revision.editedAt}-${revision.text}`}
                                    >
                                        {revision.text}
                                        <span className="ml-1 text-xs italic">
                                            (edited
                                            {editedAt ? ` ${editedAt}` : ''})
                                        </span>
                                    </p>
                                );
                            })}
                        </div>
                    ) : null}
                    <Message
                        disableActions
                        isReportPreview
                        message={message}
                        reportPoll={snapshot?.poll}
                        user={messageUser}
                    />
                    {afterTarget.map(renderContextMessage)}
                </section>
            ) : (
                <Message
                    disableActions
                    isReportPreview
                    message={message}
                    reportPoll={snapshot?.poll}
                    user={messageUser}
                />
            )}
        </section>
    );
};
