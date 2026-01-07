import React from 'react';

import { GradientText } from '@/ui/components/common/GradientText';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { NormalText } from '@/ui/components/common/NormalText';

import { DemoItem } from './DemoItem';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS } from './config';

export const TypographyDemo: React.FC = () => {
    return (
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
                    <NormalText>
                        NormalText: This is the standard text used throughout
                        the application.
                    </NormalText>
                    <MutedText>
                        MutedText: This is used for less important information,
                        timestamps, or secondary labels.
                    </MutedText>
                </div>
            </DemoItem>

            <DemoItem id="text-weights" title="Text Weights & Sizes">
                <div className="flex flex-col gap-2">
                    <NormalText weight="light" size="xs">
                        Light Tiny Text
                    </NormalText>
                    <NormalText weight="normal" size="sm">
                        Normal Small Text
                    </NormalText>
                    <NormalText weight="medium" size="base">
                        Medium Base Text
                    </NormalText>
                    <NormalText weight="semibold" size="lg">
                        Semibold Large Text
                    </NormalText>
                    <NormalText weight="bold" size="xl">
                        Bold Extra Large Text
                    </NormalText>
                    <GradientText
                        colors={['#D60270', '#9B4F96', '#0038A8 10%']}
                        angle={45}
                        repeating={true}
                        className="text-[1.25rem]"
                    >
                        Repeating Gradient Text Example
                    </GradientText>
                </div>
            </DemoItem>
        </DemoSection>
    );
};
