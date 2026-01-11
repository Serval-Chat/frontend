import React from 'react';

interface TypingIndicatorProps {
    typingUsers: Array<{ userId: string; username: string }>;
}

/**
 * @description Component to display typing indicators
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    typingUsers,
}) => {
    if (typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].username} is typing...`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
        } else {
            return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
        }
    };

    return (
        <div className="px-4 py-2 text-sm text-foreground-muted italic">
            {getTypingText()}
        </div>
    );
};
