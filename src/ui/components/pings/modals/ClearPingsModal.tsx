import React from 'react';

import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface ClearPingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ClearPingsModal: React.FC<ClearPingsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => (
    <Modal
        noPadding
        className="max-w-md"
        isOpen={isOpen}
        title="Clear All Pings"
        onClose={onClose}
    >
        <div className="p-6">
            <Text size="base">
                Are you sure you want to clear all your notifications? This
                action cannot be undone.
            </Text>
        </div>
        <Box className="flex justify-end gap-3 border-t border-border-subtle bg-bg-subtle px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button
                variant="danger"
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
            >
                Clear All
            </Button>
        </Box>
    </Modal>
);
