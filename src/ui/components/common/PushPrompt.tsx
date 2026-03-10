import React, { useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { setupWebPush } from '@/lib/pushClient';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

const isTauri = (): boolean => '__TAURI_INTERNALS__' in window;

export const PushPrompt: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isGranting, setIsGranting] = useState(false);

    useEffect(() => {
        if (isTauri() || !('Notification' in window)) return;

        if (Notification.permission === 'default') {
            const isDismissed =
                localStorage.getItem('push_prompt_dismissed') === 'true';
            if (!isDismissed) {
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleDismiss = (): void => {
        localStorage.setItem('push_prompt_dismissed', 'true');
        setIsVisible(false);
    };

    const handleEnable = async (): Promise<void> => {
        setIsGranting(true);
        try {
            await setupWebPush();
            setIsVisible(false);
        } catch (err) {
            console.error(
                'Failed to setup push notifications from prompt',
                err,
            );
        } finally {
            setIsGranting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:right-auto z-[9999] md:w-80 p-4 bg-background border border-sidebar-border shadow-2xl rounded-lg flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <Button
                aria-label="Dismiss banner"
                className="absolute top-2 right-2 p-1 text-primary-500 hover:text-primary-300"
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
            >
                <X size={16} />
            </Button>

            <Heading
                className="pr-5 text-primary-100"
                level={3}
                variant="chat-h3"
            >
                Never Miss a Message
            </Heading>
            <Text className="text-primary-400" size="sm">
                Enable push notifications to know when your friends message you.
            </Text>

            <div className="mt-2 flex justify-end gap-2">
                <Button
                    className="text-primary-400 hover:text-primary-100"
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                >
                    Not Now
                </Button>
                <Button
                    loading={isGranting}
                    size="sm"
                    variant="primary"
                    onClick={() => {
                        void handleEnable();
                    }}
                >
                    {isGranting ? 'Enabling...' : 'Enable'}
                </Button>
            </div>
        </div>
    );
};
