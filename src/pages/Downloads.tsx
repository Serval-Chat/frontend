import { type ReactNode } from 'react';

import { Download, Monitor, Smartphone } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { TopNavBar } from '@/ui/components/layout/TopNavBar';

export const Downloads = (): ReactNode => (
    <Box className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
        <TopNavBar />

        <main className="flex flex-1 flex-col items-center px-4 py-20">
            <section className="relative flex max-w-4xl flex-col items-center text-center">
                <Heading
                    className="mb-4 text-5xl font-extrabold tracking-tight sm:text-7xl"
                    level={1}
                >
                    Download <br />
                    <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                        Serchat
                    </span>
                </Heading>

                <Text
                    as="p"
                    className="mb-12 max-w-2xl sm:text-xl"
                    size="lg"
                    variant="muted"
                >
                    Experience seamless communication on any device.
                </Text>
            </section>

            <section className="mt-8 w-full max-w-4xl">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center transition-colors hover:border-primary/50">
                        <div className="mb-6 rounded-2xl bg-primary-muted p-4 text-primary">
                            <Monitor size={48} />
                        </div>
                        <Heading
                            className="mb-4 text-2xl font-bold text-foreground"
                            level={2}
                        >
                            Desktop
                        </Heading>
                        <Text className="mb-8" variant="muted">
                            Serchat for your lovely Linux.
                        </Text>

                        <div className="mt-auto flex w-full flex-col gap-4">
                            <a
                                download
                                className="w-full"
                                href="/releases/linux_x64/Serchat_latest.AppImage"
                            >
                                <Button
                                    className="w-full h-14 text-lg"
                                    variant="primary"
                                >
                                    <Download className="mr-2" size={20} />
                                    Download AppImage
                                </Button>
                            </a>
                            <div className="flex w-full gap-4">
                                <a
                                    download
                                    className="w-full flex-1"
                                    href="/releases/ubuntu/Serchat_latest.deb"
                                >
                                    <Button className="w-full" variant="normal">
                                        .deb
                                    </Button>
                                </a>
                                <a
                                    download
                                    className="w-full flex-1"
                                    href="/releases/rhel/Serchat_latest.rpm"
                                >
                                    <Button className="w-full" variant="normal">
                                        .rpm
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center transition-colors hover:border-success/50">
                        <div className="mb-6 rounded-2xl bg-success-muted p-4 text-success">
                            <Smartphone size={48} />
                        </div>
                        <Heading
                            className="mb-4 text-2xl font-bold text-foreground"
                            level={2}
                        >
                            Android
                        </Heading>
                        <Text className="mb-8" variant="muted">
                            Serchat but for phones. Smaller but usable.
                        </Text>

                        <div className="mt-auto flex w-full flex-col gap-4">
                            <a
                                download
                                className="w-full"
                                href="/releases/android/Serchat_latest.apk"
                            >
                                <Button
                                    className="w-full h-14 text-lg"
                                    variant="success"
                                >
                                    <Download className="mr-2" size={20} />
                                    Download APK
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer className="border-t border-border-subtle mx-8 py-8 text-center text-sm text-muted-foreground">
            <Text as="p">
                &copy; {new Date().getFullYear()} Serchat. Made with love for
                everyone.
            </Text>
        </footer>
    </Box>
);
