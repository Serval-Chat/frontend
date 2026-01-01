import React from 'react';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { NormalText } from '@/ui/components/NormalText';

/**
 * @description Chat page
 */
const Chat: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
            <DefaultBackground />

            <div className="relative z-10">
                <NormalText>nothing here yet but us servals~!</NormalText>
            </div>
        </div>
    );
};

export default Chat;
