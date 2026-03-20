import { type ReactNode } from 'react';

import { Download, Monitor, Smartphone } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { TopNavBar } from '@/ui/components/layout/TopNavBar';

const WindowsIcon = ({ size = 24 }: { size?: number }): React.ReactNode => (
    <svg
        height={size}
        viewBox="0 0 88 88"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M0 12.402l35.687-4.86.016 34.423-35.67.033L0 12.402zM35.67 46.528l.033 34.505-35.703-4.91V46.561l35.67-.033zM39.67 6.997L88 0v41.528l-48.33.05V6.997zM88 46.594l-.016 41.406-48.33-6.947V46.528l48.346.066z"
            fill="currentColor"
        />
    </svg>
);

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
                    Experience the SERVALLLL
                </Text>
            </section>

            <section className="mt-8 w-full max-w-6xl">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Windows */}
                    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center transition-colors hover:border-blue-500/50">
                        <div className="mb-6 rounded-2xl bg-blue-500/10 p-4 text-blue-500">
                            <WindowsIcon size={48} />
                        </div>
                        <Heading
                            className="mb-4 text-2xl font-bold text-foreground"
                            level={2}
                        >
                            Microslop™ Windows
                        </Heading>
                        <Text className="mb-8" variant="muted">
                            Serchat for your Microslop™ Windows PC.
                        </Text>

                        <div className="mt-auto flex w-full flex-col gap-4">
                            <a
                                download
                                className="w-full"
                                href="/releases/windows_x64/Serchat_v0.7.9.exe"
                            >
                                <Button
                                    className="h-14 w-full text-lg"
                                    variant="primary"
                                >
                                    <Download className="mr-2" size={20} />
                                    Download .exe
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Linux */}
                    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center transition-colors hover:border-primary/50">
                        <div className="mb-6 rounded-2xl bg-primary-muted p-4 text-primary">
                            <Monitor size={48} />
                        </div>
                        <Heading
                            className="mb-4 text-2xl font-bold text-foreground"
                            level={2}
                        >
                            Linux
                        </Heading>
                        <Text className="mb-8" variant="muted">
                            Serchat for your lovely Linux.
                        </Text>

                        <div className="mt-auto flex w-full flex-col gap-4">
                            <a
                                download
                                className="w-full"
                                href="/releases/linux_x64/Serchat_v0.7.9.AppImage"
                            >
                                <Button
                                    className="h-14 w-full text-lg"
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
                                    href="/releases/ubuntu/Serchat_v0.7.9.deb"
                                >
                                    <Button className="w-full" variant="normal">
                                        .deb
                                    </Button>
                                </a>
                                <a
                                    download
                                    className="w-full flex-1"
                                    href="/releases/rhel/Serchat_v0.7.9.rpm"
                                >
                                    <Button className="w-full" variant="normal">
                                        .rpm
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Android */}
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
                                href="/releases/android/Serchat_v0.7.9.apk"
                            >
                                <Button
                                    className="h-14 w-full text-lg"
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

        <footer className="mx-8 border-t border-border-subtle py-8 text-center text-sm text-muted-foreground">
            <Text as="p">
                &copy; {new Date().getFullYear()} Serchat. Made with love for
                everyone.
            </Text>
        </footer>
    </Box>
);
