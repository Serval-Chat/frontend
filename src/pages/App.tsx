import { type ReactNode } from 'react';

import { Link } from 'react-router-dom';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { FeatureTile } from '@/ui/components/layout/FeatureTile';
import { TopNavBar } from '@/ui/components/layout/TopNavBar';

export const App = (): ReactNode => (
    <Box className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
        <TopNavBar />

        <main className="flex flex-1 flex-col items-center px-4 py-20">
            <section className="relative flex max-w-4xl flex-col items-center text-center">
                <Heading
                    className="mb-4 text-5xl font-extrabold tracking-tight sm:text-7xl"
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
                    className="mb-12 max-w-2xl sm:text-xl"
                    size="lg"
                    variant="muted"
                >
                    A modern chat for servals and normal people
                </Text>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground opacity-80">
                            Already logged in? Get me in!!!!
                        </span>
                        <Link to="/chat">
                            <Button
                                className="h-14 px-8 text-lg"
                                variant="primary"
                            >
                                Open Chat
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <Link to="/register">
                            <Button variant="normal">
                                No account? Click me to register.
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="mt-32 w-full max-w-5xl">
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
            </section>
        </main>

        <footer className="border-t border-border-subtle py-8 text-center text-sm text-muted-foreground">
            <Text as="p">
                &copy; {new Date().getFullYear()} Serchat. Made with love for
                everyone.
            </Text>
        </footer>
    </Box>
);
