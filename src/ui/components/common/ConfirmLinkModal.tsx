import React from 'react';

import { ShieldAlert } from 'lucide-react';

import { Button } from './Button';
import { Modal } from './Modal';
import { Text } from './Text';

interface ConfirmLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    url: string;
}

/**
 * @description Modal that asks the user to confirm opening an external link.
 */
export const ConfirmLinkModal: React.FC<ConfirmLinkModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    url,
}) => (
    <Modal
        isOpen={isOpen}
        showCloseButton={false}
        title="External Link"
        onClose={onClose}
    >
        <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 shrink-0">
                    <ShieldAlert size={24} />
                </div>
                <div className="space-y-1">
                    <Text as="p" weight="semibold">
                        You are leaving Serchat
                    </Text>
                    <Text size="sm" variant="muted">
                        This link will take you to an external website. Always
                        be careful when clicking links from people you don't
                        trust.
                    </Text>
                </div>
            </div>

            <div className="space-y-2">
                <Text
                    size="xs"
                    transform="uppercase"
                    variant="muted"
                    weight="bold"
                >
                    Destination
                </Text>
                <div className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] break-all font-mono text-xs text-primary">
                    {url}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                    className="flex-1 sm:order-2 gap-2"
                    variant="success"
                    onClick={onConfirm}
                >
                    Visit Website
                </Button>
                <Button className="flex-1 sm:order-1" onClick={onClose}>
                    Go Back
                </Button>
            </div>
        </div>
    </Modal>
);
