import { MainChat } from '@/ui/components/chat/MainChat';
import { cn } from '@/utils/cn';

/**
 * @description Main chat area content component.
 */
export const MainContent: React.FC = () => {
    return (
        <main
            className={cn('flex-1 flex flex-col relative z-10 overflow-hidden')}
        >
            <MainChat />
        </main>
    );
};
