import type React from 'react';
import { useEffect } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    setSelectedServerId,
    setTargetMessageId,
} from '@/store/slices/navSlice';
import { isValidObjectId } from '@/utils/validation';

/**
 * @description Syncs Redux navigation state from the current URL.
 */
export const NavigationSync: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const { selectedServerId, selectedChannelId } = useAppSelector(
        (state) => state.nav,
    );

    useEffect(() => {
        const path = location.pathname;

        if (path === '/chat' || path === '/chat/') {
            void navigate('/chat/@me', { replace: true });
            return;
        }

        if (path === '/chat/@me') {
            dispatch(setSelectedFriendId(null));
            dispatch(setTargetMessageId(null));
        } else if (params.serverId) {
            if (!isValidObjectId(params.serverId)) {
                void navigate('/chat/@me', { replace: true });
                return;
            }

            let contextChanged = false;
            if (selectedServerId !== params.serverId) {
                dispatch(setSelectedServerId(params.serverId));
                contextChanged = true;
            }

            if (params.channelId) {
                if (!isValidObjectId(params.channelId)) {
                    void navigate(`/chat/@server/${params.serverId}`, {
                        replace: true,
                    });
                    return;
                }

                if (selectedChannelId !== params.channelId) {
                    dispatch(setSelectedChannelId(params.channelId));
                    contextChanged = true;
                }

                if (params.messageId) {
                    if (!isValidObjectId(params.messageId)) {
                        void navigate(
                            `/chat/@server/${params.serverId}/channel/${params.channelId}`,
                            { replace: true },
                        );
                        return;
                    }

                    dispatch(setTargetMessageId(params.messageId));
                    void navigate(
                        `/chat/@server/${params.serverId}/channel/${params.channelId}`,
                        { replace: true },
                    );
                } else if (contextChanged) {
                    // Clear if we changed channels and no new message was specified
                    dispatch(setTargetMessageId(null));
                }
            } else if (contextChanged) {
                dispatch(setTargetMessageId(null));
            }
        } else if (params.userId) {
            if (!isValidObjectId(params.userId)) {
                void navigate('/chat/@me', { replace: true });
                return;
            }

            if (params.messageId) {
                if (!isValidObjectId(params.messageId)) {
                    void navigate(`/chat/@user/${params.userId}`, {
                        replace: true,
                    });
                    return;
                }

                dispatch(setTargetMessageId(params.messageId));
                void navigate(`/chat/@user/${params.userId}`, {
                    replace: true,
                });
            } else {
                dispatch(setSelectedFriendId(params.userId));
                dispatch(setTargetMessageId(null));
            }
        }
        // @setting routes are handled by the SettingsModal via PrimaryNavBar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        location.pathname,
        params.serverId,
        params.channelId,
        params.userId,
        params.messageId,
    ]);

    return null;
};
