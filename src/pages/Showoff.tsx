import { Button } from '../ui/components/Button';
import { useFlashText } from '../hooks/useFlashText';
import {
    TableOfContents,
    type TOCProps,
} from '../ui/components/TableOfContents';

function Showoff() {
    const [normalButtonText, normalButtonFlash] = useFlashText(
        'Normal Button',
        'Clicked!',
        2500
    );
    const [cautionButtonText, cautionButtonFlash] = useFlashText(
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

    const normalProcessing = useFlashText(
        'Normal Processing',
        'Processing...',
        2500
    );
    const cautionProcessing = useFlashText(
        'Caution Processing',
        'Processing...',
        2500
    );
    const dangerProcessing = useFlashText(
        'Danger Processing',
        'Processing...',
        2500
    );
    const successProcessing = useFlashText(
        'Success Processing',
        'Processing...',
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
    ];

    return (
        <>
            <TableOfContents sections={sections} />

            <h1 className="my-4 text-xl font-bold">
                Show off of elements (because I work on core elements now, right
                UI and logic will be later added).
            </h1>

            {/* Flash buttons */}
            <div id="flash-buttons" className="p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                    Flash buttons (change text after click)
                </h2>
                <div className="flex flex-wrap gap-2">
                    <div id="normal-flash" className="p-1">
                        <Button buttonType="normal" onClick={normalButtonFlash}>
                            {normalButtonText}
                        </Button>
                    </div>
                    <div id="caution-flash" className="p-1">
                        <Button
                            buttonType="caution"
                            onClick={cautionButtonFlash}
                        >
                            {cautionButtonText}
                        </Button>
                    </div>
                    <div id="dangerous-flash" className="p-1">
                        <Button
                            buttonType="danger"
                            onClick={dangerousButtonFlash}
                        >
                            {dangerousButtonText}
                        </Button>
                    </div>
                    <div id="success-flash" className="p-1">
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
            <div id="processing-buttons" className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                    Processing buttons (graying out)
                </h2>
                <div className="flex flex-wrap gap-2">
                    <div id="normal-processing" className="p-1">
                        <Button
                            buttonType="normal"
                            onClick={normalProcessing[1]}
                            loading={normalProcessing[0] === 'Processing...'}
                        >
                            {normalProcessing[0]}
                        </Button>
                    </div>
                    <div id="caution-processing" className="p-1">
                        <Button
                            buttonType="caution"
                            onClick={cautionProcessing[1]}
                            loading={cautionProcessing[0] === 'Processing...'}
                        >
                            {cautionProcessing[0]}
                        </Button>
                    </div>
                    <div id="danger-processing" className="p-1">
                        <Button
                            buttonType="danger"
                            onClick={dangerProcessing[1]}
                            loading={dangerProcessing[0] === 'Processing...'}
                        >
                            {dangerProcessing[0]}
                        </Button>
                    </div>
                    <div id="success-processing" className="p-1">
                        <Button
                            buttonType="success"
                            onClick={successProcessing[1]}
                            loading={successProcessing[0] === 'Processing...'}
                        >
                            {successProcessing[0]}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Showoff;
