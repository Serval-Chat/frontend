import React from 'react';

/**
 * @description cool ass gradient in the background
 */
export const DefaultBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 animate-pulse" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-bounce duration-[10s]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-bounce duration-[15s]" />
        </div>
    );
};
