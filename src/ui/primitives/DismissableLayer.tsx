import React from 'react';

import { createPortal } from 'react-dom';

import { Pressable } from './Pressable';
import { useEscapeToClose } from './useEscapeToClose';

interface DismissableLayerProps {
    label: string;
    onDismiss: () => void;
    children: React.ReactNode;
}

// Hosts such as the emoji picker close on a document-level mousedown, and this
// layer is portaled outside of them.
const stopPointerDown = (e: React.MouseEvent | React.TouchEvent): void => {
    e.stopPropagation();
};

/**
 * @description Portals floating content above every other layer behind a
 * transparent backdrop. Clicking or right-clicking the backdrop, or Escape
 * (topmost overlay only), dismisses it; the dismissing click does not reach
 * what is underneath.
 */
export const DismissableLayer = ({
    label,
    onDismiss,
    children,
}: DismissableLayerProps): React.ReactPortal => {
    useEscapeToClose(true, onDismiss);

    return createPortal(
        <div
            className="relative z-popout"
            role="presentation"
            onMouseDown={stopPointerDown}
            onTouchStart={stopPointerDown}
        >
            <Pressable
                aria-label={label}
                className="fixed inset-0 cursor-default"
                tabIndex={-1}
                onClick={onDismiss}
                onContextMenu={(e): void => {
                    e.preventDefault();
                    onDismiss();
                }}
            />
            {children}
        </div>,
        document.body,
    );
};
