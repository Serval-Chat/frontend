import React from 'react';

import { MessagesList } from '@/ui/components/chat/MessagesList';
import { NormalText } from '@/ui/components/common/NormalText';

import { DemoSection } from './DemoSection';

const MOCK_USERS = {
    catflare: {
        _id: 'u1',
        login: 'catflare',
        createdAt: new Date(),
        username: 'catflare',
        displayName: 'Catflare',
        profilePicture: 'https://catfla.re/images/servals/serval-1.jpg',
        usernameGradient: {
            enabled: true,
            angle: 90,
            colors: ['#ff9a9e', '#fecfef'],
        },
        usernameGlow: {
            enabled: false,
            color: '#ff9a9e',
        },
    },
    hexagon: {
        _id: 'u2',
        login: 'hexagon',
        createdAt: new Date(),
        username: 'hexagon',
        displayName: 'hexagon',
        profilePicture: 'https://catfla.re/images/servals/serval-4.jpg',
        usernameGradient: {
            enabled: true,
            angle: 135,
            repeating: true,
            colors: ['#D60270', '#9B4F96', '#0038A8 14.28%'],
        },
        usernameGlow: {
            enabled: false,
            color: '#4facfe',
        },
    },
    evalyn: {
        _id: 'u3',
        login: 'evalyn',
        createdAt: new Date(),
        username: 'evalyn',
        displayName: 'Evalyn',
        profilePicture: 'https://catfla.re/images/servals/serval-5.jpg',
        usernameGradient: {
            enabled: true,
            angle: 45,
            colors: ['#f093fb', '#f5576c'],
        },
        usernameGlow: {
            enabled: false,
            color: '#f093fb',
        },
    },
    mintsuki: {
        _id: 'u4',
        login: 'mintsuki',
        createdAt: new Date(),
        username: 'mintsuki',
        displayName: 'Mintsuki',
        profilePicture: 'https://catfla.re/images/servals/serval-6.jpg',
        usernameGradient: {
            enabled: false,
            colors: [],
            angle: 0,
        },
        usernameGlow: {
            enabled: false,
            color: '',
        },
    },
};

const MOCK_MESSAGES = [
    {
        _id: '0',
        text: 'Hello everyone! I hope you guys like Serchat uwu',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: MOCK_USERS.catflare,
    },
    {
        _id: '1',
        text: 'Yas! I love this place',
        createdAt: new Date(Date.now() - 3550000).toISOString(),
        user: MOCK_USERS.hexagon,
        replyTo: {
            _id: '0',
            user: MOCK_USERS.catflare,
            text: 'Hello everyone! I hope you guys like Serchat uwu',
        },
    },
    {
        _id: '2',
        text: "Please fix this bug. I can't change default role for my members!",
        createdAt: new Date(Date.now() - 3500000).toISOString(),
        user: MOCK_USERS.evalyn,
    },
    {
        _id: '3',
        text: 'I forgot my password. Could you plz reset it thx',
        createdAt: new Date(Date.now() - 3450000).toISOString(),
        user: MOCK_USERS.mintsuki,
    },
    {
        _id: '4',
        text: 'Eh fine but I got no reset password feature :sob:',
        createdAt: new Date(Date.now() - 3400000).toISOString(),
        user: MOCK_USERS.catflare,
        replyTo: {
            _id: '3',
            user: MOCK_USERS.mintsuki,
            text: 'I forgot my password. Could you plz reset it thx',
        },
    },
    {
        _id: '5',
        text: 'Anyways @everyone I have to reload the server. New update incoming :333',
        createdAt: new Date(Date.now() - 3350000).toISOString(),
        user: MOCK_USERS.catflare,
    },
];

export const ChatDemo: React.FC = () => {
    return (
        <DemoSection id="chat-messages" title="Chat Messages">
            <div className="space-y-6">
                <div>
                    <p className="text-white/60 text-sm mt-1">
                        Showoff for messages
                    </p>
                </div>

                <div className="bg-background rounded-xl border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[500px]">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <NormalText weight="semibold" className="text-white/90">
                            # General (English)
                        </NormalText>
                    </div>
                    <MessagesList messages={MOCK_MESSAGES} />
                </div>
            </div>
        </DemoSection>
    );
};
