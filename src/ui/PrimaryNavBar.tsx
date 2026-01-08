import { Home, Settings } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNavMode } from '@/store/slices/navSlice';
import { Divider } from '@/ui/components/common/Divider';
import { IconButton } from '@/ui/components/common/IconButton';
import { ServerList } from '@/ui/components/servers/ServerList';
import { cn } from '@/utils/cn';

export const PrimaryNavBar: React.FC = () => {
    const dispatch = useAppDispatch();
    const navMode = useAppSelector((state) => state.nav.navMode);

    return (
        <nav
            className={cn(
                'h-full flex flex-col items-center py-3 gap-3',
                'bg-[--color-background]',
                'w-[72px] shrink-0'
            )}
        >
            <div>
                <IconButton
                    icon={Home}
                    isActive={navMode === 'friends'}
                    onClick={() => dispatch(setNavMode('friends'))}
                />
            </div>

            <Divider />

            <ServerList />

            <Divider />

            <div>
                <IconButton icon={Settings} />
            </div>
        </nav>
    );
};
