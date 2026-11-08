import type { ReactNode } from 'react';

import { Animations } from '@/dev/showoff/Animations';
import { CalloutBoxDemo } from '@/dev/showoff/CalloutBoxDemo';
import { ChatDemo } from '@/dev/showoff/ChatDemo';
import { ColorPalette } from '@/dev/showoff/ColorPalette';
import { ContextMenuDemo } from '@/dev/showoff/ContextMenuDemo';
import { CopyDialogDemo } from '@/dev/showoff/CopyDialogDemo';
import { DividerPresentation } from '@/dev/showoff/DividerPresentation';
import { FlashButtons } from '@/dev/showoff/FlashButtons';
import { InputsDemo } from '@/dev/showoff/InputsDemo';
import { LoadingSpinnerDemo } from '@/dev/showoff/LoadingSpinnerDemo';
import { NavigationDemo } from '@/dev/showoff/NavigationDemo';
import { ProcessingButtons } from '@/dev/showoff/ProcessingButtons';
import { PushPromptDemo } from '@/dev/showoff/PushPromptDemo';
import { RetainSizeButtons } from '@/dev/showoff/RetainSizeButtons';
import { SearchDemo } from '@/dev/showoff/SearchDemo';
import { SpecializedButtons } from '@/dev/showoff/SpecializedButtons';
import { StatusMessages } from '@/dev/showoff/StatusMessages';
import { type TOCProps, TableOfContents } from '@/dev/showoff/TableOfContents';
import { ToastDemo } from '@/dev/showoff/ToastDemo';
import { TogglesDemo } from '@/dev/showoff/TogglesDemo';
import { TypographyDemo } from '@/dev/showoff/TypographyDemo';
import { UserIdentitiesDemo } from '@/dev/showoff/UserIdentitiesDemo';
import { UserProfilePopupDemo } from '@/dev/showoff/UserProfilePopupDemo';
import { SHOWOFF_SECTIONS } from '@/dev/showoff/config';
import { Heading } from '@/ui/primitives/Heading';

const sections: TOCProps['sections'] = [
    {
        id: SHOWOFF_SECTIONS.search,
        title: 'Message Search',
    },
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
        id: SHOWOFF_SECTIONS.pushPrompt,
        title: 'Push Notifications Prompt',
    },
    {
        id: SHOWOFF_SECTIONS.toast,
        title: 'Toast Notifications',
    },
    {
        id: SHOWOFF_SECTIONS.colorPalette,
        title: 'Leptailurus Serval Color Palette',
    },
    {
        id: SHOWOFF_SECTIONS.copyDialog,
        title: 'Retro Copy Dialog',
    },
    {
        id: SHOWOFF_SECTIONS.calloutBox,
        title: 'Callout Boxes',
        children: [
            { id: 'callout-discovery-blockers', title: 'Discovery Blockers' },
            { id: 'callout-muted-composer', title: 'Muted Composer Notice' },
            {
                id: 'callout-disciplinary-history',
                title: 'Disciplinary History',
            },
            { id: 'callout-banned-account', title: 'Banned Account' },
            { id: 'callout-muted-account', title: 'Muted Account' },
            { id: 'callout-must-sign-in', title: 'Must Sign In' },
        ],
    },
];

export const Showoff = (): ReactNode => (
    <>
        <TableOfContents sections={sections} />

        <Heading variant="section">
            Show off of elements (because I work on core elements now, right UI
            and logic will be later added).
        </Heading>

        <SearchDemo />
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
        <PushPromptDemo />
        <ToastDemo />

        <InputsDemo />
        <TogglesDemo />
        <LoadingSpinnerDemo />
        <ColorPalette />
        <CopyDialogDemo />
        <CalloutBoxDemo />
    </>
);
