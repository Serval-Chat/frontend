import React, { useEffect } from 'react';

import { useMe } from '@/api/users/users.queries';
import { PrimaryNavBar } from '@/ui/PrimaryNavBar';
import { SecondaryNavBar } from '@/ui/SecondaryNavBar';
import { TertiarySidebar } from '@/ui/TertiarySidebar';
import { Box } from '@/ui/components/layout/Box';
import { MainContent } from '@/ui/components/layout/MainContent';

/**
 * @description Chat page
 */
export const Chat: React.FC = () => {
    const { data: user, error } = useMe();

    useEffect(() => {
        if (user) {
            // console.log('Current user:', user);
        }
        if (error) {
            console.error('Error fetching user:', error);
        }
    }, [user, error]);

    return (
        <Box className="h-screen w-full flex bg-[var(--chat-bg)] overflow-hidden">
            <PrimaryNavBar />
            <SecondaryNavBar />
            <MainContent />
            <TertiarySidebar />
        </Box>
    );
};
