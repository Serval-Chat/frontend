import React from 'react';

import { Button } from '@/ui/components/common/Button';
import { Link } from '@/ui/components/common/Link';
import { Box } from '@/ui/components/layout/Box';

export const TopNavBar: React.FC = () => (
    <Box className="sticky top-0 z-[var(--z-sticky)] w-full border-b border-border-subtle bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link
                className="flex items-center gap-2 hover:no-underline no-underline"
                to="/"
            >
                <img alt="Serchat" className="h-8 w-8" src="/serval.png" />
                <span className="text-xl font-bold tracking-tight text-foreground">
                    Serchat
                </span>
            </Link>

            <div className="flex items-center gap-4">
                <Link className="hover:no-underline" to="/login">
                    <Button size="sm" variant="ghost">
                        Login
                    </Button>
                </Link>
                <Link className="hover:no-underline" to="/register">
                    <Button size="sm" variant="primary">
                        Register
                    </Button>
                </Link>
            </div>
        </div>
    </Box>
);
