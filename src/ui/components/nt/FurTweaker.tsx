import React from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setFurOpacity,
    setFurSeed,
    setFurSpotCount,
    toggleFurTweaker,
} from '@/store/slices/furTweakerSlice';
import { NTButton } from '@/ui/components/nt/NTButton';
import { NTPanel } from '@/ui/components/nt/NTPanel';
import { NTSlider } from '@/ui/components/nt/NTSlider';
import { Window } from '@/ui/components/nt/Window';

export const FurTweaker: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, spotCount, opacity, seed } = useAppSelector(
        (state) => state.furTweaker,
    );

    if (!isOpen) return null;

    return (
        <Window
            defaultHeight={300}
            defaultWidth={350}
            defaultX={200}
            defaultY={200}
            icon="/icons/retro/chip.png"
            title="Serval Fur Tweaker"
            onClose={() => dispatch(toggleFurTweaker())}
        >
            <div className="flex min-h-0 flex-1 flex-col bg-[#c0c0c0] p-2">
                <NTPanel
                    className="nt-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3"
                    variant="inset"
                >
                    <NTSlider
                        label="Spot Count"
                        max={300}
                        min={0}
                        step={1}
                        value={spotCount}
                        onValueChange={(v) => dispatch(setFurSpotCount(v))}
                    />

                    <NTSlider
                        label="Spot Opacity"
                        max={1}
                        min={0}
                        step={0.01}
                        value={opacity}
                        onValueChange={(v) => dispatch(setFurOpacity(v))}
                    />

                    <NTSlider
                        label="Pattern Seed"
                        max={9999999}
                        min={0}
                        step={1}
                        value={seed}
                        onValueChange={(v) => dispatch(setFurSeed(v))}
                    />

                    <div className="mt-auto flex justify-center pt-4">
                        <NTButton
                            onClick={() => dispatch(setFurSeed(Date.now()))}
                        >
                            Randomize Seed
                        </NTButton>
                    </div>
                </NTPanel>
            </div>
        </Window>
    );
};
