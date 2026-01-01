import { Button } from '@/ui/components/Button';
import { useFlashGroup } from '@/hooks/useFlashText';
import { DemoSection } from './DemoSection';
import { SHOWOFF_SECTIONS, BUTTON_VARIANTS } from './config';

export function FlashButtons() {
    const flashButtons = useFlashGroup({
        normal: { initial: 'Normal Button', flash: 'Clicked!' },
        caution: { initial: 'Caution Button', flash: 'Clicked!' },
        danger: { initial: 'Dangerous Button', flash: 'Clicked!' },
        success: { initial: 'Success Button', flash: 'Clicked!' },
    });

    return (
        <DemoSection
            id={SHOWOFF_SECTIONS.flash}
            title="Flash buttons (change text after click)"
        >
            <div className="flex flex-wrap gap-xs">
                {BUTTON_VARIANTS.map(({ id, type }) => (
                    <div key={id} id={`${id}-flash`} className="p-xs">
                        <Button
                            buttonType={type}
                            onClick={
                                flashButtons[id as keyof typeof flashButtons]
                                    .trigger
                            }
                        >
                            {
                                flashButtons[id as keyof typeof flashButtons]
                                    .label
                            }
                        </Button>
                    </div>
                ))}
            </div>
        </DemoSection>
    );
}
