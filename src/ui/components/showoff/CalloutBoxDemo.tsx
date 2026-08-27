import type { ReactNode } from 'react';

import { AlertTriangle, ShieldAlert, VolumeX } from 'lucide-react';

import { CalloutBox } from '@/ui/components/common/CalloutBox';
import { Text } from '@/ui/components/common/Text';
import { Stack } from '@/ui/components/layout/Stack';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const CalloutBoxDemo = (): ReactNode => (
    <DemoSection id={SHOWOFF_SECTIONS.calloutBox} title="Callout Boxes">
        <Stack className="w-full max-w-md" gap="lg">
            <DemoItem id="callout-discovery-blockers" title="Discovery blockers (ServerInfoSection)">
                <CalloutBox className="rounded-md p-3" title="Discovery blockers">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>Server needs a vanity link.</li>
                    </ul>
                </CalloutBox>
            </DemoItem>

            <DemoItem id="callout-muted-composer" title="Muted composer notice (ComposerRestrictionNotice)">
                <CalloutBox icon={VolumeX} title="You are muted.">
                    <Text
                        as="div"
                        className="truncate text-sm opacity-80"
                        variant="caution"
                    >
                        Spamming in #general
                    </Text>
                    <Text
                        as="div"
                        className="mt-0.5 text-xs font-medium opacity-65"
                        variant="caution"
                    >
                        Until: in 12 minutes
                    </Text>
                </CalloutBox>
            </DemoItem>

            <DemoItem id="callout-disciplinary-history" title="Disciplinary history (StandingSettings)">
                <CalloutBox icon={ShieldAlert} title="Disciplinary History">
                    <Text as="p" size="sm" variant="muted">
                        Below is a list of warnings issued to your account.
                        Some may require acknowledgment before they can be
                        dismissed.
                    </Text>
                </CalloutBox>
            </DemoItem>

            <DemoItem id="callout-banned-account" title="Banned account (AdminUserDetailSections, danger)">
                <CalloutBox icon={AlertTriangle} title="Banned Account" variant="danger">
                    <Text as="p" size="sm">
                        <Text as="span" variant="muted">
                            Until:
                        </Text>{' '}
                        <Text as="span" weight="black">
                            Never (permanent)
                        </Text>
                    </Text>
                </CalloutBox>
            </DemoItem>

            <DemoItem id="callout-muted-account" title="Muted account (AdminUserDetailSections, caution)">
                <CalloutBox icon={VolumeX} title="Muted Account">
                    <Text as="p" size="sm">
                        <Text as="span" variant="muted">
                            Until:
                        </Text>{' '}
                        <Text as="span" weight="black">
                            in 6 hours
                        </Text>
                    </Text>
                    <Text className="mt-2" size="sm">
                        <Text as="span" variant="muted">
                            Reason:
                        </Text>{' '}
                        <Text as="span" weight="semibold">
                            Repeated spam
                        </Text>
                    </Text>
                </CalloutBox>
            </DemoItem>

            <DemoItem id="callout-must-sign-in" title="Must sign in (BotAuthorize)">
                <CalloutBox
                    className="px-3.5 py-3 text-left text-sm"
                    icon={AlertTriangle}
                >
                    <span className="text-muted-foreground">
                        You must be{' '}
                        <span className="font-semibold text-primary underline-offset-2 hover:underline">
                            signed in
                        </span>{' '}
                        to add this bot.
                    </span>
                </CalloutBox>
            </DemoItem>
        </Stack>
    </DemoSection>
);
