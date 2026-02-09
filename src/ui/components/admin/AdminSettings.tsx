import { type ReactNode } from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { ThemeSwitcher } from '@/ui/components/settings/ThemeSwitcher';

export const AdminSettings = (): ReactNode => (
    <div className="mx-auto max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="space-y-6">
            <div>
                <Heading level={2} variant="admin-page">
                    Appearance
                </Heading>
                <Text as="p" size="sm" variant="muted">
                    Customize how Serchat looks and feels for your admin
                    session.
                </Text>
            </div>

            <ThemeSwitcher variant="admin" />
        </section>
    </div>
);
