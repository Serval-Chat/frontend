import React from 'react';
import { DemoSection } from './DemoSection';
import { DemoItem } from './DemoItem';
import { SHOWOFF_SECTIONS } from './config';
import { Heading } from '../common/Heading';
import { NormalText } from '../common/NormalText';
import { MutedText } from '../common/MutedText';

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
                    <NormalText className="font-light text-xs">
                        Light Tiny Text
                    </NormalText>
                    <NormalText className="font-normal text-sm">
                        Normal Small Text
                    </NormalText>
                    <NormalText className="font-medium text-base">
                        Medium Base Text
                    </NormalText>
                    <NormalText className="font-semibold text-lg">
                        Semibold Large Text
                    </NormalText>
                    <NormalText className="font-bold text-xl">
                        Bold Extra Large Text
                    </NormalText>
                </div>
            </DemoItem>
        </DemoSection>
    );
};
