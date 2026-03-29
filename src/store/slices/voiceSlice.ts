import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface VoiceState {
    activeVoiceServerId: string | null;
    activeVoiceChannelId: string | null;
    voiceParticipants: Record<string, string[]>;
    speakingUsers: string[];
    isMuted: boolean;
    isDeafened: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
    userVolumes: Record<string, number>;
    voiceUserStates: Record<string, { isMuted: boolean; isDeafened: boolean }>;
}

const initialState: VoiceState = {
    activeVoiceServerId: null,
    activeVoiceChannelId: null,
    voiceParticipants: {},
    speakingUsers: [],
    isMuted: false,
    isDeafened: false,
    connectionQuality: 'unknown',
    userVolumes: {},
    voiceUserStates: {},
};

const voiceSlice = createSlice({
    name: 'voice',
    initialState,
    reducers: {
        joinVoiceRoom: (
            state,
            action: PayloadAction<{ serverId: string; channelId: string }>,
        ) => {
            state.activeVoiceServerId = action.payload.serverId;
            state.activeVoiceChannelId = action.payload.channelId;
        },
        leaveVoiceRoom: (state) => {
            state.activeVoiceServerId = null;
            state.activeVoiceChannelId = null;
            state.speakingUsers = [];
        },
        setVoiceParticipants: (
            state,
            action: PayloadAction<{ channelId: string; userIds: string[] }>,
        ) => {
            state.voiceParticipants[action.payload.channelId] =
                action.payload.userIds;
        },
        addVoiceParticipant: (
            state,
            action: PayloadAction<{ channelId: string; userId: string }>,
        ) => {
            const { channelId, userId } = action.payload;
            if (!state.voiceParticipants[channelId]) {
                state.voiceParticipants[channelId] = [];
            }
            if (!state.voiceParticipants[channelId].includes(userId)) {
                state.voiceParticipants[channelId].push(userId);
            }
        },
        removeVoiceParticipant: (
            state,
            action: PayloadAction<{ channelId: string; userId: string }>,
        ) => {
            const { channelId, userId } = action.payload;
            if (state.voiceParticipants[channelId]) {
                state.voiceParticipants[channelId] = state.voiceParticipants[
                    channelId
                ].filter((id) => id !== userId);
            }
        },
        clearUserFromAllVoiceChannels: (
            state,
            action: PayloadAction<string>,
        ) => {
            const userId = action.payload;
            for (const channelId in state.voiceParticipants) {
                state.voiceParticipants[channelId] = state.voiceParticipants[
                    channelId
                ].filter((id) => id !== userId);
            }
        },
        setSpeakingUsers: (state, action: PayloadAction<string[]>) => {
            state.speakingUsers = action.payload;
        },
        toggleMute: (state) => {
            state.isMuted = !state.isMuted;
            if (!state.isMuted) {
                state.isDeafened = false;
            }
        },
        toggleDeafen: (state) => {
            state.isDeafened = !state.isDeafened;
            if (state.isDeafened) {
                state.isMuted = true;
            }
        },
        setConnectionQuality: (
            state,
            action: PayloadAction<VoiceState['connectionQuality']>,
        ) => {
            state.connectionQuality = action.payload;
        },
        setUserVolume: (
            state,
            action: PayloadAction<{ userId: string; volume: number }>,
        ) => {
            state.userVolumes[action.payload.userId] = action.payload.volume;
        },
        setVoiceUserState: (
            state,
            action: PayloadAction<{
                userId: string;
                isMuted: boolean;
                isDeafened: boolean;
            }>,
        ) => {
            state.voiceUserStates[action.payload.userId] = {
                isMuted: action.payload.isMuted,
                isDeafened: action.payload.isDeafened,
            };
        },
    },
});

export const {
    joinVoiceRoom,
    leaveVoiceRoom,
    setVoiceParticipants,
    addVoiceParticipant,
    removeVoiceParticipant,
    clearUserFromAllVoiceChannels,
    setSpeakingUsers,
    toggleMute,
    toggleDeafen,
    setConnectionQuality,
    setUserVolume,
    setVoiceUserState,
} = voiceSlice.actions;
export const voiceReducer = voiceSlice.reducer;
