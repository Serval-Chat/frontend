import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { useFlashText } from '@/hooks/useFlashText';
import {
    TableOfContents,
    type TOCProps,
} from '@/ui/components/TableOfContents';
import { BouncingDots } from '@/ui/animations/BouncingDots';

function Showoff() {
    const [normalButtonText, normalButtonFlash] = useFlashText(
        'Normal Button',
        'Clicked!',
        2500
    );
    const [normalButtonText2, normalButtonFlash2] = useFlashText(
        'Normal Button',
        'Clicked!',
        2500
    );
    const [cautionButtonText, cautionButtonFlash] = useFlashText(
        'Caution Button',
        'Clicked!',
        2500
    );
    const [cautionButtonText2, cautionButtonFlash2] = useFlashText(
        'Caution Button',
        'Clicked!',
        2500
    );
    const [dangerousButtonText, dangerousButtonFlash] = useFlashText(
        'Dangerous Button',
        'Clicked!',
        2500
    );
    const [successButtonText, successButtonFlash] = useFlashText(
        'Success Button',
        'Clicked!',
        2500
    );

    const normalProcessing = useFlashText('Normal Processing', 'Loading', 2500);
    const cautionProcessing = useFlashText(
        'Caution Processing',
        'Loading',
        2500
    );
    const dangerProcessing = useFlashText('Danger Processing', 'Loading', 2500);
    const successProcessing = useFlashText(
        'Success Processing',
        'Loading',
        2500
    );

    const sections: TOCProps['sections'] = [
        {
            id: 'flash-buttons',
            title: 'Flash buttons (change text after click)',
            children: [
                { id: 'normal-flash', title: 'Normal Button' },
                { id: 'caution-flash', title: 'Caution Button' },
                { id: 'dangerous-flash', title: 'Dangerous Button' },
                { id: 'success-flash', title: 'Success Button' },
            ],
        },
        {
            id: 'processing-buttons',
            title: 'Processing buttons (graying out)',
            children: [
                { id: 'normal-processing', title: 'Normal Processing' },
                { id: 'caution-processing', title: 'Caution Processing' },
                { id: 'danger-processing', title: 'Danger Processing' },
                { id: 'success-processing', title: 'Success Processing' },
            ],
        },
        {
            id: 'animations',
            title: 'Animations',
            children: [{ id: 'bouncing-dots', title: 'Bouncing Dots' }],
        },
        {
            id: 'retain-size-buttons',
            title: 'Retain Size buttons (lock size after text change)',
            children: [
                { id: 'normal-retain', title: 'Normal Retain' },
                { id: 'caution-retain', title: 'Caution Retain' },
            ],
        },
        {
            id: 'input-elements',
            title: 'Input elements',
            children: [
                { id: 'input-normal', title: 'Normal Input' },
                { id: 'input-disabled', title: 'Disabled Input' },
                { id: 'input-width', title: 'Width Constrained Input' },
            ],
        },
    ];

    return (
        <>
            <TableOfContents sections={sections} />

            <h1 className="my-md text-xl font-bold font-sans">
                Show off of elements (because I work on core elements now, right
                UI and logic will be later added).
            </h1>

            {/* Flash buttons */}
            <div id="flash-buttons" className="p-md mb-lg font-sans">
                <h2 className="text-lg font-semibold mb-md">
                    Flash buttons (change text after click)
                </h2>
                <div className="flex flex-wrap gap-xs">
                    <div id="normal-flash" className="p-xs">
                        <Button buttonType="normal" onClick={normalButtonFlash}>
                            {normalButtonText}
                        </Button>
                    </div>
                    <div id="caution-flash" className="p-xs">
                        <Button
                            buttonType="caution"
                            onClick={cautionButtonFlash}
                        >
                            {cautionButtonText}
                        </Button>
                    </div>
                    <div id="dangerous-flash" className="p-xs">
                        <Button
                            buttonType="danger"
                            onClick={dangerousButtonFlash}
                        >
                            {dangerousButtonText}
                        </Button>
                    </div>
                    <div id="success-flash" className="p-xs">
                        <Button
                            buttonType="success"
                            onClick={successButtonFlash}
                        >
                            {successButtonText}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Processing buttons */}
            <div id="processing-buttons" className="p-md font-sans">
                <h2 className="text-lg font-semibold mb-md">
                    Processing buttons (graying out)
                </h2>
                <div className="flex flex-wrap gap-xs">
                    <div id="normal-processing" className="p-xs">
                        <Button
                            buttonType="normal"
                            onClick={normalProcessing[1]}
                            loading={normalProcessing[0] === 'Loading'}
                        >
                            {normalProcessing[0]}
                        </Button>
                    </div>
                    <div id="caution-processing" className="p-xs">
                        <Button
                            buttonType="caution"
                            onClick={cautionProcessing[1]}
                            loading={cautionProcessing[0] === 'Loading'}
                        >
                            {cautionProcessing[0]}
                        </Button>
                    </div>
                    <div id="danger-processing" className="p-xs">
                        <Button
                            buttonType="danger"
                            onClick={dangerProcessing[1]}
                            loading={dangerProcessing[0] === 'Loading'}
                        >
                            {dangerProcessing[0]}
                        </Button>
                    </div>
                    <div id="success-processing" className="p-xs">
                        <Button
                            buttonType="success"
                            onClick={successProcessing[1]}
                            loading={successProcessing[0] === 'Loading'}
                        >
                            {successProcessing[0]}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <div id="animations" className="p-md font-sans">
                <h2 className="text-lg font-semibold mb-md">Animations</h2>
                <div className="flex flex-col gap-md">
                    <div id="bouncing-dots" className="p-xs">
                        <h3 className="text-md font-medium mb-sm">
                            Bouncing Dots (Wave)
                        </h3>
                        <BouncingDots size={4} />
                    </div>
                </div>
            </div>

            {/* Retain Size buttons */}
            <div id="retain-size-buttons" className="p-md font-sans">
                <h2 className="text-lg font-semibold mb-md">
                    Retain Size buttons (lock size after text change)
                </h2>
                <div className="flex flex-wrap gap-xs">
                    <div id="normal-retain" className="p-xs">
                        <Button
                            buttonType="normal"
                            onClick={normalButtonFlash2}
                            retainSize={true}
                        >
                            {normalButtonText2}
                        </Button>
                    </div>
                    <div id="caution-retain" className="p-xs">
                        <Button
                            buttonType="caution"
                            onClick={cautionButtonFlash2}
                            retainSize={true}
                        >
                            {cautionButtonText2}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Input elements */}
            <div id="input-elements" className="p-md font-sans">
                <h2 className="text-lg font-semibold mb-md">Input elements</h2>
                <div className="flex flex-col gap-md max-w-sm">
                    <div id="input-normal" className="p-xs">
                        <h3 className="text-md font-medium mb-sm">
                            Normal Input
                        </h3>
                        <Input placeholder="Type something..." />
                    </div>
                    <div id="input-disabled" className="p-xs">
                        <h3 className="text-md font-medium mb-sm">
                            Disabled Input
                        </h3>
                        <Input disabled placeholder="Can't type here..." />
                    </div>
                    <div id="input-width" className="p-xs">
                        <h3 className="text-md font-medium mb-sm">
                            Width Constrained (min: 200px, max: 300px)
                        </h3>
                        <Input
                            minWidth={200}
                            maxWidth={300}
                            placeholder="I have width limits..."
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default Showoff;
