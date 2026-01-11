import React from 'react';

import { Heading } from '@/ui/components/common/Heading';
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
}) => {
    return (
        <div className="flex flex-col gap-2">
            <div
                className="h-24 w-full rounded-lg shadow-md border border-border-subtle"
                style={{ backgroundColor: `var(${variable})` }}
            />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                    {name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                    {variable}
                </span>
                {description && (
                    <span className="text-xs text-muted-foreground mt-1 italic">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};

export const ColorPalette: React.FC = () => {
    return (
        <section id={SHOWOFF_SECTIONS.colorPalette} className="mt-12 px-6 py-6">
            <Heading level={2} variant="section" className="mb-6">
                Leptailurus Serval Color Palette
            </Heading>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Main Colors */}
                <ColorSwatch
                    name="Primary (Serval Coat)"
                    variable="--color-primary"
                    description="Serval serval serval serval."
                />
                <ColorSwatch
                    name="Caution (Tawny)"
                    variable="--color-caution"
                    description="Serval serval serval."
                />
                <ColorSwatch
                    name="Success"
                    variable="--color-success"
                    description="Serval serval."
                />
                <ColorSwatch
                    name="Danger"
                    variable="--color-danger"
                    description="Serval serval serval serval serval."
                />

                {/* Background & Foreground */}
                <ColorSwatch
                    name="Background (Serval Spot Brown)"
                    variable="--color-background"
                    description="Serval serval serval."
                />
                <ColorSwatch
                    name="Foreground"
                    variable="--color-foreground"
                    description="Serval serval serval serval."
                />
                <ColorSwatch
                    name="Muted Foreground"
                    variable="--color-muted-foreground"
                    description="Serval serval serval."
                />
                <ColorSwatch
                    name="Secondary BG"
                    variable="--color-bg-secondary"
                    description="Serval serval serval serval."
                />
            </div>

            <div className="mt-8 p-6 rounded-xl bg-bg-subtle border border-border-subtle">
                <p className="text-muted-foreground leading-relaxed">
                    This pallete is very{' '}
                    <span className="text-primary font-bold italic">
                        serval
                    </span>
                    . Serval serval serval serval serval serval.
                </p>
            </div>
        </section>
    );
};
