import type React from 'react';
import { useEffect } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedFriendId,
    setSelectedServerId,
} from '@/store/slices/navSlice';

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
        } else if (params.serverId && params.channelId) {
            if (selectedServerId !== params.serverId) {
                dispatch(setSelectedServerId(params.serverId));
            }
            if (selectedChannelId !== params.channelId) {
                dispatch(setSelectedChannelId(params.channelId));
            }
        } else if (params.userId) {
            dispatch(setSelectedFriendId(params.userId));
        }
        // @setting routes are handled by the SettingsModal via PrimaryNavBar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, params.serverId, params.channelId, params.userId]);

    return null;
};
