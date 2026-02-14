import { type ReactNode } from 'react';

import { Heading } from '@/ui/components/common/Heading';
import { Animations } from '@/ui/components/showoff/Animations';
import { ChatDemo } from '@/ui/components/showoff/ChatDemo';
import { ColorPalette } from '@/ui/components/showoff/ColorPalette';
import { ContextMenuDemo } from '@/ui/components/showoff/ContextMenuDemo';
import { DividerPresentation } from '@/ui/components/showoff/DividerPresentation';
import { FlashButtons } from '@/ui/components/showoff/FlashButtons';
import { InputsDemo } from '@/ui/components/showoff/InputsDemo';
import { LoadingSpinnerDemo } from '@/ui/components/showoff/LoadingSpinnerDemo';
import { NavigationDemo } from '@/ui/components/showoff/NavigationDemo';
import { ProcessingButtons } from '@/ui/components/showoff/ProcessingButtons';
import { RetainSizeButtons } from '@/ui/components/showoff/RetainSizeButtons';
import { SpecializedButtons } from '@/ui/components/showoff/SpecializedButtons';
import { StatusMessages } from '@/ui/components/showoff/StatusMessages';
import {
    type TOCProps,
    TableOfContents,
} from '@/ui/components/showoff/TableOfContents';
import { TogglesDemo } from '@/ui/components/showoff/TogglesDemo';
import { TypographyDemo } from '@/ui/components/showoff/TypographyDemo';
import { UserIdentitiesDemo } from '@/ui/components/showoff/UserIdentitiesDemo';
import { UserProfilePopupDemo } from '@/ui/components/showoff/UserProfilePopupDemo';
import { SHOWOFF_SECTIONS } from '@/ui/components/showoff/config';

export const Showoff = (): ReactNode => {
    const sections: TOCProps['sections'] = [
        {
            id: SHOWOFF_SECTIONS.typography,
            title: 'Typography & Text System',
        },
        {
            id: SHOWOFF_SECTIONS.userIdentities,
            title: 'User Identities & Avatars',
        },
        {
            id: SHOWOFF_SECTIONS.navigation,
            title: 'Navigation Components',
            children: [
                { id: 'server-icons', title: 'Server Icons' },
                {
                    id: SHOWOFF_SECTIONS.serverItems,
                    title: 'Server Items (read & unread)',
                },
                { id: 'friend-items', title: 'Friend List Items' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.chatMessages,
            title: 'Chat Message Components',
        },
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
                { id: 'input-password', title: 'Password Input' },
                { id: 'input-number', title: 'Number Input' },
                { id: 'input-width', title: 'Width Constrained Input' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.toggles,
            title: 'Toggle Switches',
            children: [
                { id: 'toggle-normal', title: 'Normal Toggle' },
                { id: 'toggle-label', title: 'Toggle with Label' },
                { id: 'toggle-disabled', title: 'Disabled Toggle' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.loadingSpinner,
            title: 'Loading Spinner',
            children: [
                { id: 'spinner-sm', title: 'Small' },
                { id: 'spinner-md', title: 'Medium' },
                { id: 'spinner-lg', title: 'Large' },
            ],
        },
        {
            id: SHOWOFF_SECTIONS.contextMenu,
            title: 'Context Menu Dropdown',
        },
        {
            id: SHOWOFF_SECTIONS.userProfilePopup,
            title: 'User Profile Popup',
        },

        {
            id: SHOWOFF_SECTIONS.colorPalette,
            title: 'Leptailurus Serval Color Palette',
        },
    ];

    return (
        <>
            <TableOfContents sections={sections} />

            <Heading variant="section">
                Show off of elements (because I work on core elements now, right
                UI and logic will be later added).
            </Heading>

            <TypographyDemo />
            <UserIdentitiesDemo />
            <NavigationDemo />
            <ChatDemo />
            <FlashButtons />
            <ProcessingButtons />
            <Animations />
            <StatusMessages />
            <RetainSizeButtons />
            <DividerPresentation />
            <SpecializedButtons />

            <ContextMenuDemo />
            <UserProfilePopupDemo />

            <InputsDemo />
            <TogglesDemo />
            <LoadingSpinnerDemo />
            <ColorPalette />
        </>
    );
};
