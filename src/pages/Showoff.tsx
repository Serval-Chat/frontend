import {
    TableOfContents,
    type TOCProps,
} from '@/ui/components/showoff/TableOfContents';
import { SHOWOFF_SECTIONS } from '@/ui/components/showoff/config';
import { FlashButtons } from '@/ui/components/showoff/FlashButtons';
import { ProcessingButtons } from '@/ui/components/showoff/ProcessingButtons';
import { Animations } from '@/ui/components/showoff/Animations';
import { StatusMessages } from '@/ui/components/showoff/StatusMessages';
import { RetainSizeButtons } from '@/ui/components/showoff/RetainSizeButtons';
import { InputsDemo } from '@/ui/components/showoff/InputsDemo';
import { Heading } from '@/ui/components/common/Heading';
import { DividerPresentation } from '@/ui/components/showoff/DividerPresentation';
import { SpecializedButtons } from '@/ui/components/showoff/SpecializedButtons';

function Showoff() {
    const sections: TOCProps['sections'] = [
        {
            id: SHOWOFF_SECTIONS.flash,
            title: 'Flash buttons (change text after click)',
            children: [
                { id: 'normal-flash', title: 'Normal Button' },
                { id: 'caution-flash', title: 'Caution Button' },
                { id: 'dangerous-flash', title: 'Dangerous Button' },
                { id: 'success-flash', title: 'Success Button' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.processing,
            title: 'Processing buttons (graying out)',
            children: [
                { id: 'normal-processing', title: 'Normal Processing' },
                { id: 'caution-processing', title: 'Caution Processing' },
                { id: 'danger-processing', title: 'Danger Processing' },
                { id: 'success-processing', title: 'Success Processing' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.animations,
            title: 'Animations',
            children: [{ id: 'bouncing-dots', title: 'Bouncing Dots' }],
        },
        {
            id: SHOWOFF_SECTIONS.status,
            title: 'Status Messages',
            children: [
                { id: 'status-error', title: 'Error Message' },
                { id: 'status-success', title: 'Success Message' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.retain,
            title: 'Retain Size buttons (lock size after text change)',
            children: [
                { id: 'normal-retain', title: 'Normal Retain' },
                { id: 'caution-retain', title: 'Caution Retain' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.inputs,
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

            <Heading variant="section">
                Show off of elements (because I work on core elements now, right
                UI and logic will be later added).
            </Heading>

            <FlashButtons />
            <ProcessingButtons />
            <Animations />
            <StatusMessages />
            <RetainSizeButtons />
            <DividerPresentation />
            <SpecializedButtons />

            <InputsDemo />
        </>
    );
}

export default Showoff;
