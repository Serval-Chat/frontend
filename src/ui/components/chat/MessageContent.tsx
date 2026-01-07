import React from 'react';

interface MessageContentProps {
    text: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
    return (
        <div className="text-sm text-white/80 leading-relaxed break-words whitespace-pre-wrap">
            {text}
        </div>
    );
};
