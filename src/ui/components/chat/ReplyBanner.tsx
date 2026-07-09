import { X } from 'lucide-react';

import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { BotTag } from '@/ui/components/common/BotTag';
import { Button } from '@/ui/components/common/Button';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface ReplyBannerProps {
    replyingTo: ProcessedChatMessage;
    replyingUser: User;
    disableColors?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    disableGlowAndColors?: boolean;
    onCancelReply?: () => void;
}

export const ReplyBanner = ({
    replyingTo,
    replyingUser,
    disableColors,
    disableCustomFonts,
    disableGlow,
    disableGlowAndColors,
    onCancelReply,
}: ReplyBannerProps): React.ReactNode => (
    <Box className="pride-glass flex items-center justify-between gap-3 border-b border-border-subtle bg-bg-subtle/30 px-3 py-2">
        <Box className="flex min-w-0 items-center gap-2">
            <Text className="text-xs whitespace-nowrap text-muted-foreground">
                Replying to
            </Text>
            <StyledUserName
                className="text-xs font-bold whitespace-nowrap"
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                role={replyingTo.role}
                user={replyingUser}
            >
                {replyingUser.displayName || replyingUser.username}
            </StyledUserName>
            {replyingUser.isBot ? (
                <BotTag className="h-3.5 px-1 text-[8px]" />
            ) : null}
            <Box className="flex items-center gap-1 truncate overflow-hidden text-xs whitespace-nowrap text-muted-foreground opacity-80">
                {replyingTo.interaction && !replyingTo.text ? (
                    <span className="opacity-70">
                        used{' '}
                        <span className="font-bold text-primary">
                            /{replyingTo.interaction.command}
                        </span>
                    </span>
                ) : null}
                <ParsedText
                    condenseCodeBlocks
                    condenseFiles
                    condenseInvites
                    nodes={parseText(
                        replyingTo.text || '',
                        ParserPresets.MESSAGE,
                    )}
                    size="xs"
                    wrap="nowrap"
                />
            </Box>
        </Box>
        <Button
            className="h-7 w-7 shrink-0 p-0"
            size="sm"
            title="Cancel reply"
            variant="ghost"
            onClick={onCancelReply}
        >
            <X size={16} />
        </Button>
    </Box>
);
