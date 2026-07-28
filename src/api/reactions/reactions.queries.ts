import {
    type InfiniteData,
    type UseMutationResult,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import type { ChatMessage } from '@/api/chat/chat.types';
import { useFrequentlyUsedEmojis } from '@/hooks/useFrequentlyUsedEmojis';

import { reactionsApi } from './reactions.api';
import type {
    AddReactionRequest,
    ReactionsResponse,
    RemoveReactionRequest,
} from './reactions.types';

export const useAddReaction = (): UseMutationResult<
    ReactionsResponse,
    Error,
    {
        messageId: string;
        serverId?: string;
        channelId?: string;
        data: AddReactionRequest;
    }
> => {
    const queryClient = useQueryClient();
    const { recordUsage } = useFrequentlyUsedEmojis();

    return useMutation({
        mutationFn: async ({
            messageId,
            serverId,
            channelId,
            data,
        }: {
            messageId: string;
            serverId?: string;
            channelId?: string;
            data: AddReactionRequest;
        }): Promise<ReactionsResponse> => {
            if (serverId && channelId) {
                return reactionsApi.addServerReaction(
                    serverId,
                    channelId,
                    messageId,
                    data,
                );
            }
            return reactionsApi.addDmReaction(messageId, data);
        },
        onMutate: (variables): void => {
            recordUsage({
                emoji: variables.data.emoji,
                emojiType:
                    variables.data.emojiType === 'custom'
                        ? 'custom'
                        : 'unicode',
                emojiId: variables.data.emojiId,
            });
        },
        onSuccess: (response, variables): void => {
            const { messageId } = variables;
            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                { queryKey: ['chat', 'messages'] },
                (
                    old,
                ):
                    | { pages: ChatMessage[][]; pageParams: unknown[] }
                    | undefined => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page): ChatMessage[] =>
                            page.map(
                                (msg): ChatMessage =>
                                    msg.id === messageId
                                        ? {
                                              ...msg,
                                              reactions: response.reactions,
                                          }
                                        : msg,
                            ),
                        ),
                    };
                },
            );
        },
    });
};

export const useRemoveReaction = (): UseMutationResult<
    ReactionsResponse,
    Error,
    {
        messageId: string;
        serverId?: string;
        channelId?: string;
        data: RemoveReactionRequest;
    }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            messageId,
            serverId,
            channelId,
            data,
        }: {
            messageId: string;
            serverId?: string;
            channelId?: string;
            data: RemoveReactionRequest;
        }): Promise<ReactionsResponse> => {
            if (serverId && channelId) {
                return reactionsApi.removeServerReaction(
                    serverId,
                    channelId,
                    messageId,
                    data,
                );
            }
            return reactionsApi.removeDmReaction(messageId, data);
        },
        onSuccess: (response, variables): void => {
            const { messageId } = variables;
            queryClient.setQueriesData<InfiniteData<ChatMessage[]>>(
                { queryKey: ['chat', 'messages'] },
                (
                    old,
                ):
                    | { pages: ChatMessage[][]; pageParams: unknown[] }
                    | undefined => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page): ChatMessage[] =>
                            page.map(
                                (msg): ChatMessage =>
                                    msg.id === messageId
                                        ? {
                                              ...msg,
                                              reactions: response.reactions,
                                          }
                                        : msg,
                            ),
                        ),
                    };
                },
            );
        },
    });
};
