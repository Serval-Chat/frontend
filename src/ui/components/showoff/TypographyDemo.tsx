import React from 'react';

import { GradientText } from '@/ui/components/common/GradientText';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Text } from '@/ui/components/common/Text';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const TypographyDemo: React.FC = () => (
    <DemoSection
        id={SHOWOFF_SECTIONS.typography}
        title="Typography & Text System"
    >
        <DemoItem id="headings" title="Heading Components">
            <div className="flex flex-col gap-4">
                <Heading level={1} variant="page">
                    Page Heading (h1)
                </Heading>
                <Heading level={2} variant="section">
                    Section Heading (h2)
                </Heading>
                <Heading level={3} variant="sub">
                    Sub Heading (h3)
                </Heading>
                <Heading level={4} variant="sub">
                    Small Sub Heading (h4)
                </Heading>
            </div>
        </DemoItem>

        <DemoItem id="body-text" title="Body Text Components">
            <div className="flex flex-col gap-4">
                <Text>
                    NormalText: This is the standard text used throughout the
                    application.
                </Text>
                <MutedText>
                    MutedText: This is used for less important information,
                    timestamps, or secondary labels.
                </MutedText>
            </div>
        </DemoItem>

        <DemoItem id="text-weights" title="Text Weights & Sizes">
            <div className="flex flex-col gap-2">
                <Text size="xs" weight="light">
                    Light Tiny Text
                </Text>
                <Text size="sm" weight="normal">
                    Normal Small Text
                </Text>
                <Text size="base" weight="medium">
                    Medium Base Text
                </Text>
                <Text size="lg" weight="semibold">
                    Semibold Large Text
                </Text>
                <Text size="xl" weight="bold">
                    Bold Extra Large Text
                </Text>
                <GradientText
                    repeating
                    angle={45}
                    className="text-[1.25rem]"
                    colors={['#D60270', '#9B4F96', '#0038A8 10%']}
                >
                    Repeating Gradient Text Example
                </GradientText>
            </div>
        </DemoItem>
    </DemoSection>
);
