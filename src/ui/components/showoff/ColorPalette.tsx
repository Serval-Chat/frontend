import React from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';
import { SHOWOFF_SECTIONS } from '@/ui/components/showoff/config';

interface ColorSwatchProps {
    name: string;
    variable: string;
    description?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
    name,
    variable,
    description,
}) => (
    <div className="flex flex-col gap-2">
        <div
            className="h-24 w-full rounded-lg shadow-md border border-border-subtle"
            style={{ backgroundColor: `var(${variable})` }}
        />
        <div className="flex flex-col">
            <Text as="span" size="sm" weight="bold">
                {name}
            </Text>
            <Text as="span" className="font-mono" size="xs" variant="muted">
                {variable}
            </Text>
            {description && (
                <Text
                    as="span"
                    className="mt-1 italic"
                    size="xs"
                    variant="muted"
                >
                    {description}
                </Text>
            )}
        </div>
    </div>
);

export const ColorPalette: React.FC = () => (
    <section className="mt-12 px-6 py-6" id={SHOWOFF_SECTIONS.colorPalette}>
        <Heading className="mb-6" level={2} variant="section">
            Leptailurus Serval Color Palette
        </Heading>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Main Colors */}
            <ColorSwatch
                description="Serval serval serval serval."
                name="Primary (Serval Coat)"
                variable="--color-primary"
            />
            <ColorSwatch
                description="Serval serval serval."
                name="Caution (Tawny)"
                variable="--color-caution"
            />
            <ColorSwatch
                description="Serval serval."
                name="Success"
                variable="--color-success"
            />
            <ColorSwatch
                description="Serval serval serval serval serval."
                name="Danger"
                variable="--color-danger"
            />

            {/* Background & Foreground */}
            <ColorSwatch
                description="Serval serval serval."
                name="Background (Serval Spot Brown)"
                variable="--color-background"
            />
            <ColorSwatch
                description="Serval serval serval serval."
                name="Foreground"
                variable="--color-foreground"
            />
            <ColorSwatch
                description="Serval serval serval."
                name="Muted Foreground"
                variable="--color-muted-foreground"
            />
            <ColorSwatch
                description="Serval serval serval serval."
                name="Secondary BG"
                variable="--color-bg-secondary"
            />
        </div>

        <div className="mt-8 p-6 rounded-xl bg-bg-subtle border border-border-subtle">
            <Text as="p" className="leading-relaxed" variant="muted">
                This pallete is very{' '}
                <span className="text-primary font-bold italic">serval</span>.
                Serval serval serval serval serval serval.
            </Text>
        </div>
    </section>
);
