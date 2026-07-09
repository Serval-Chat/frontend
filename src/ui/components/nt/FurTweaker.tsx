import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setFurOpacity,
    setFurSeed,
    setFurSpotCount,
    toggleFurTweaker,
} from '@/store/slices/furTweakerSlice';
import { NTButton } from '@/ui/components/nt/NTButton';
import { NTPanel } from '@/ui/components/nt/NTPanel';
import { NTScrollArea } from '@/ui/components/nt/NTScrollArea';
import { NTSlider } from '@/ui/components/nt/NTSlider';
import { Window } from '@/ui/components/nt/Window';

export const FurTweaker = () => {
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
            onClose={(): {
                payload: undefined;
                type: 'furTweaker/toggleFurTweaker';
            } => dispatch(toggleFurTweaker())}
        >
            <div className="flex min-h-0 flex-1 flex-col bg-[#c0c0c0] p-2">
                <NTPanel className="flex min-h-0 flex-1 p-0" variant="inset">
                    <NTScrollArea
                        className="min-h-0 flex-1"
                        viewportClassName="flex flex-col gap-6 p-3"
                    >
                        <NTSlider
                            label="Spot Count"
                            max={300}
                            min={0}
                            step={1}
                            value={spotCount}
                            onValueChange={(
                                v,
                            ): {
                                payload: number;
                                type: 'furTweaker/setFurSpotCount';
                            } => dispatch(setFurSpotCount(v))}
                        />

                        <NTSlider
                            label="Spot Opacity"
                            max={1}
                            min={0}
                            step={0.01}
                            value={opacity}
                            onValueChange={(
                                v,
                            ): {
                                payload: number;
                                type: 'furTweaker/setFurOpacity';
                            } => dispatch(setFurOpacity(v))}
                        />

                        <NTSlider
                            label="Pattern Seed"
                            max={9_999_999}
                            min={0}
                            step={1}
                            value={seed}
                            onValueChange={(
                                v,
                            ): {
                                payload: number;
                                type: 'furTweaker/setFurSeed';
                            } => dispatch(setFurSeed(v))}
                        />

                        <div className="mt-auto flex justify-center pt-4">
                            <NTButton
                                // inside a click handler, not evaluated during
                                // render - and this is a client-only SPA
                                // (createRoot, no hydrateRoot/SSR) anyway.
                                onClick={(): void => {
                                    // react-doctor-disable-next-line react-doctor/rendering-hydration-mismatch-time
                                    dispatch(setFurSeed(Date.now()));
                                }}
                            >
                                Randomize Seed
                            </NTButton>
                        </div>
                    </NTScrollArea>
                </NTPanel>
            </div>
        </Window>
    );
};
