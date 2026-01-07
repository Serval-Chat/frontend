import React, { useEffect } from 'react';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { PrimaryNavBar } from '@/ui/PrimaryNavBar';
import { SecondaryNavBar } from '@/ui/SecondaryNavBar';
import { NormalText } from '@/ui/components/NormalText';
import { useMe } from '@/api/users/users.queries';

/**
 * @description Chat page
 */
const Chat: React.FC = () => {
    const { data: user, error } = useMe();

    useEffect(() => {
        if (user) {
            console.log('Current user:', user);
        }
        if (error) {
            console.error('Error fetching user:', error);
        }
    }, [user, error]);

    return (
        <div className="h-screen w-full flex bg-background overflow-hidden">
            <PrimaryNavBar />
            <SecondaryNavBar />

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <DefaultBackground />
                <NormalText>nothing here yet but us servals~!</NormalText>
            </div>
        </div>
    );
};

export default Chat;
