import type { CSSProperties, ReactNode } from 'react';

import { ArrowRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { FeatureTile } from '@/ui/components/layout/FeatureTile';
import { TopNavBar } from '@/ui/components/layout/TopNavBar';

const CURRENT_YEAR = new Date().getFullYear();

const HERO_BUTTON_STYLE: CSSProperties = {
    height: '3rem',
    paddingInline: '1.5rem',
    fontSize: '1rem',
};

export const App = (): ReactNode => (
    <Box className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
        <TopNavBar />

        <main className="flex flex-1 flex-col">
            <section className="flex flex-col items-center px-4 pt-24 pb-28 text-center">
                <Heading
                    className="mb-5 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl"
                    level={1}
                >
                    Text with your <br />
                    <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                        Friends
                    </span>{' '}
                    on Serchat
                </Heading>

                <Text
                    as="p"
                    className="mb-10 max-w-2xl sm:text-xl"
                    size="lg"
                    variant="muted"
                >
                    A modern chat for servals and normal people
                </Text>

                <span className="mb-3 text-sm font-medium text-muted-foreground opacity-80">
                    Already logged in? Get me in!!!!
                </span>

                <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
                    <Link to="/chat">
                        <Button
                            fullWidth
                            icon={ArrowRight}
                            iconPosition="right"
                            style={HERO_BUTTON_STYLE}
                            variant="primary"
                        >
                            Open Chat
                        </Button>
                    </Link>
                    <Link to="/downloads">
                        <Button
                            fullWidth
                            icon={Download}
                            style={HERO_BUTTON_STYLE}
                            variant="normal"
                        >
                            Download App
                        </Button>
                    </Link>
                </div>

                <Text as="p" className="mt-5" size="sm" variant="muted">
                    No account?{' '}
                    <Link
                        className="font-medium text-primary hover:underline"
                        to="/register"
                    >
                        Register here
                    </Link>
                </Text>
            </section>

            <section className="border-y border-border-subtle bg-bg-secondary/40 px-4 py-20">
                <div className="mx-auto w-full max-w-5xl">
                    <Heading
                        className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground"
                        level={2}
                    >
                        Everything you need in one place
                    </Heading>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureTile
                            description="Give users in your servers nice colors to make them standout or just look awesome!"
                            image="/feature-colorful-usernames.png"
                            title="Colorful usernames for free"
                        />
                        <FeatureTile
                            description="Want your server to be unique? Just get yourself vanity link!!"
                            image="/feature-vanity-links.png"
                            title="Free vanity links"
                        />
                        <FeatureTile
                            description="Isn't it? Your roles can be expressive and we just allow that"
                            image="/feature-role-freedom.png"
                            title="Customizability is great"
                        />
                    </div>
                </div>
            </section>
        </main>

        <footer className="py-8 text-center text-sm text-muted-foreground">
            <Text as="p">
                &copy; {CURRENT_YEAR} Serchat. Made with love for everyone.
            </Text>
        </footer>
    </Box>
);
