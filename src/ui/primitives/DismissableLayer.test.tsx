import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DismissableLayer } from './DismissableLayer';
import { Modal } from './Modal';

describe('DismissableLayer', (): void => {
    it('dismisses on backdrop click and right-click', (): void => {
        const onDismiss = vi.fn();
        render(
            <DismissableLayer label="Close info" onDismiss={onDismiss}>
                <div>content</div>
            </DismissableLayer>,
        );
        const backdrop = screen.getByRole('button', { name: 'Close info' });
        fireEvent.click(backdrop);
        expect(fireEvent.contextMenu(backdrop)).toBe(false);
        expect(onDismiss).toHaveBeenCalledTimes(2);
    });

    it('does not dismiss when its content is clicked', (): void => {
        const onDismiss = vi.fn();
        render(
            <DismissableLayer label="Close info" onDismiss={onDismiss}>
                <div>content</div>
            </DismissableLayer>,
        );
        fireEvent.click(screen.getByText('content'));
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('keeps pointer-downs inside it from reaching document listeners', (): void => {
        const outside = vi.fn();
        document.addEventListener('mousedown', outside);
        render(
            <DismissableLayer label="Close info" onDismiss={vi.fn()}>
                <div>content</div>
            </DismissableLayer>,
        );
        fireEvent.mouseDown(screen.getByText('content'));
        fireEvent.mouseDown(screen.getByRole('button', { name: 'Close info' }));
        document.removeEventListener('mousedown', outside);
        expect(outside).not.toHaveBeenCalled();
    });

    it('closes only the topmost overlay on Escape', (): void => {
        const closeModal = vi.fn();
        const closeLayer = vi.fn();
        const renderModal = (withLayer: boolean) => (
            <Modal isOpen title="Settings" onClose={closeModal}>
                {withLayer ? (
                    <DismissableLayer label="Close info" onDismiss={closeLayer}>
                        <div>content</div>
                    </DismissableLayer>
                ) : null}
            </Modal>
        );
        const { rerender } = render(renderModal(false));
        rerender(renderModal(true));

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(closeLayer).toHaveBeenCalledTimes(1);
        expect(closeModal).not.toHaveBeenCalled();

        rerender(renderModal(false));
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(closeModal).toHaveBeenCalledTimes(1);
        expect(closeLayer).toHaveBeenCalledTimes(1);
    });
});
