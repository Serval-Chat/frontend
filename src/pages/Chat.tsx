import React, { useEffect } from 'react';

import { useMe } from '@/api/users/users.queries';
import { PrimaryNavBar } from '@/ui/PrimaryNavBar';
import { SecondaryNavBar } from '@/ui/SecondaryNavBar';
import { TertiarySidebar } from '@/ui/TertiarySidebar';
import { MainContent } from '@/ui/components/layout/MainContent';

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
            <MainContent />
            <TertiarySidebar />
        </div>
    );
};

export default Chat;
