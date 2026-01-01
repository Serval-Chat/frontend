import React from 'react';
import { Link } from 'react-router-dom';
import { DefaultBackground } from '@/ui/components/DefaultBackground';

/**
 * @description 404 Not Found page
 */
const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            <div className="relative z-10 text-center space-y-md">
                <h1 className="text-4xl font-bold tracking-tight text-foreground/90">
                    404
                </h1>
                <div className="h-px w-12 bg-border mx-auto" />
                <p className="text-muted-foreground font-medium">
                    Page not found
                </p>
                <Link
                    to="/"
                    className="inline-block mt-xl text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                    Go back home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
