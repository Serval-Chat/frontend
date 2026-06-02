import React from 'react';

import { MotionConfig } from 'framer-motion';

import { useMe } from '@/api/users/users.queries';

const LimitedAnimationsContext = React.createContext(false);

export const useLimitedAnimations = (): boolean =>
    React.useContext(LimitedAnimationsContext);

export const LimitedAnimationsProvider = ({
    children,
}: {
    children: React.ReactNode;
}): React.ReactNode => {
    const { data: user } = useMe();
    const limitedAnimations = user?.settings?.limitedAnimations ?? false;

    React.useEffect((): void => {
        document.documentElement.classList.toggle(
            'limited-animations',
            limitedAnimations,
        );
    }, [limitedAnimations]);

    return (
        <LimitedAnimationsContext.Provider value={limitedAnimations}>
            <MotionConfig
                reducedMotion={limitedAnimations ? 'always' : 'never'}
            >
                {children}
            </MotionConfig>
        </LimitedAnimationsContext.Provider>
    );
};
