import React from 'react';

import { Calendar, Globe } from 'lucide-react';

import type { User } from '@/api/users/users.types';
import { ParsedEmoji } from '@/features/messages/ParsedEmoji';
import { ParsedText } from '@/features/messages/ParsedText';
import { ParsedUnicodeEmoji } from '@/features/messages/ParsedUnicodeEmoji';
import { Box } from '@/ui/primitives/Box';
import { Heading } from '@/ui/primitives/Heading';
import { Link } from '@/ui/primitives/Link';
import { Text } from '@/ui/primitives/Text';
import { APP_LOCALE } from '@/utils/locale';
import type { parseText } from '@/utils/textParser/parser';
import { isCustomEmojiId } from '@/utils/validation';

import { InlineEditableField } from './InlineEditableField';
import { PrivateFieldHint } from './PrivateFieldHint';

export const ProfileCardDetails = ({
    user,
    isOwnProfile,
    adminView,
    ps,
    finalCustomText,
    finalCustomEmoji,
    bioNodes,
    bioValue,
    onBioChange,
    visibleConnections,
    joinedAt,
    isWebhook,
}: {
    user?: User | Partial<User>;
    isOwnProfile: boolean;
    adminView?: boolean;
    ps?: User['privacySettings'];
    finalCustomText?: string;
    finalCustomEmoji?: string;
    bioNodes: ReturnType<typeof parseText>;
    bioValue?: string;
    onBioChange?: (value: string) => void;
    visibleConnections: NonNullable<User['connections']>;
    joinedAt?: string;
    isWebhook: boolean;
}): React.ReactNode => (
    <>
        {finalCustomText || finalCustomEmoji ? (
            <Box className="mb-4 flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
                {finalCustomEmoji ? (
                    <Box className="flex shrink-0 items-center">
                        {isCustomEmojiId(finalCustomEmoji) ? (
                            <ParsedEmoji
                                nonInteractive
                                className="h-4 w-4"
                                emojiId={finalCustomEmoji}
                            />
                        ) : (
                            <ParsedUnicodeEmoji
                                className="h-4 w-4 text-[16px]"
                                content={finalCustomEmoji}
                            />
                        )}
                    </Box>
                ) : null}
                <Text
                    as="span"
                    className="min-w-0 flex-1 break-words whitespace-normal"
                    size="xs"
                    variant="muted"
                >
                    {finalCustomText}
                    <PrivateFieldHint
                        adminView={adminView}
                        isOwnProfile={isOwnProfile}
                        visible={ps?.hideStatus === true}
                    />
                </Text>
            </Box>
        ) : null}

        {isWebhook ? null : <Box className="my-3 h-px w-full bg-divider" />}

        {user?.bio || onBioChange ? (
            <Box className="mb-4">
                <div className="mb-2 flex items-center gap-1.5">
                    <Heading
                        className="text-xs font-bold text-muted-foreground uppercase"
                        level={3}
                    >
                        About Me
                    </Heading>
                    <PrivateFieldHint
                        adminView={adminView}
                        isOwnProfile={isOwnProfile}
                        visible={ps?.hideBio === true}
                    />
                </div>
                {onBioChange ? (
                    <InlineEditableField
                        multiline
                        buttonClassName="w-full items-start"
                        inputClassName="min-h-[160px] w-full resize-none rounded-md border border-primary bg-bg-subtle px-1.5 py-1 text-[10px] leading-relaxed text-foreground focus:outline-none"
                        placeholder="Tell us about yourself..."
                        title="Edit bio"
                        value={bioValue ?? user?.bio ?? ''}
                        onChange={onBioChange}
                    >
                        <Box className="min-w-0 flex-1 text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                            {user?.bio ? (
                                <ParsedText
                                    nodes={bioNodes}
                                    size="xs"
                                    wrap="preWrap"
                                />
                            ) : (
                                <Text
                                    className="text-muted-foreground/70"
                                    fontStyle="italic"
                                >
                                    Tell us about yourself...
                                </Text>
                            )}
                        </Box>
                    </InlineEditableField>
                ) : (
                    <Box className="text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                        <ParsedText nodes={bioNodes} size="xs" wrap="preWrap" />
                    </Box>
                )}
            </Box>
        ) : null}

        {visibleConnections.length > 0 ? (
            <Box className="mb-4">
                <div className="mb-2 flex items-center gap-1.5">
                    <Heading
                        className="text-xs font-bold text-muted-foreground uppercase"
                        level={3}
                    >
                        Connections
                    </Heading>
                    <PrivateFieldHint
                        adminView={adminView}
                        isOwnProfile={isOwnProfile}
                        visible={ps?.hideConnections === true}
                    />
                </div>
                <Box className="flex flex-col gap-1.5">
                    {visibleConnections.map((connection) => (
                        <Link
                            external
                            className="flex min-w-0 items-center gap-2 text-xs"
                            href={`https://${connection.value}`}
                            key={connection.id}
                            size="xs"
                        >
                            <Globe className="shrink-0" size={13} />
                            <Text className="truncate">{connection.value}</Text>
                        </Link>
                    ))}
                </Box>
            </Box>
        ) : null}

        {/* Webhooks were never members, so "Member Since" is meaningless for
            them (their createdAt is just the message timestamp) and they have
            no server join date, so the whole row drops out. */}
        {!isWebhook || joinedAt ? (
            <Box className="mb-4 flex gap-4">
                {isWebhook ? null : (
                    <Box className="min-w-0 flex-1">
                        <Heading
                            className="mb-2 text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            Member Since
                        </Heading>
                        <Box className="flex items-center gap-2 text-sm text-foreground/80">
                            <Calendar className="shrink-0" size={14} />
                            <Text as="span" className="truncate">
                                {user?.createdAt
                                    ? new Date(
                                          user.createdAt,
                                      ).toLocaleDateString(APP_LOCALE, {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                      })
                                    : null}
                            </Text>
                        </Box>
                    </Box>
                )}

                {joinedAt ? (
                    <Box className="min-w-0 flex-1">
                        <Heading
                            className="mb-2 truncate text-xs font-bold text-muted-foreground uppercase"
                            level={3}
                        >
                            Joined Server
                        </Heading>
                        <Box className="flex items-center gap-2 text-sm text-foreground/80">
                            <Calendar className="shrink-0" size={14} />
                            <Text as="span" className="truncate">
                                {new Date(joinedAt).toLocaleDateString(
                                    APP_LOCALE,
                                    {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    },
                                )}
                            </Text>
                        </Box>
                    </Box>
                ) : null}
            </Box>
        ) : null}
    </>
);
