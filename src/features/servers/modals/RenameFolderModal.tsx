import React, { useState } from 'react';

import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Input } from '@/ui/primitives/Input';
import { Modal } from '@/ui/primitives/Modal';
import { Text } from '@/ui/primitives/Text';

interface RenameFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onRename: (newName: string) => void;
}

export const RenameFolderModal = ({
    isOpen,
    onClose,
    currentName,
    onRename,
}: RenameFolderModalProps) => {
    // react-doctor-disable-next-line react-doctor/no-derived-useState
    const [name, setName] = useState(currentName);
    const [syncedIsOpen, setSyncedIsOpen] = useState(isOpen);

    if (isOpen !== syncedIsOpen) {
        setSyncedIsOpen(isOpen);
        if (isOpen) setName(currentName);
    }

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (name.trim()) {
            onRename(name.trim());
            onClose();
        }
    };

    return (
        <Modal
            className="max-w-md"
            isOpen={isOpen}
            key={isOpen ? currentName : 'closed'}
            title="Rename Folder"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit}>
                <Box className="flex flex-col gap-4">
                    <Box className="flex flex-col gap-1.5">
                        <Text
                            as="label"
                            className="text-[10px] font-bold tracking-wider text-text-muted uppercase"
                            htmlFor="folder-name"
                        >
                            Folder Name
                        </Text>
                        <Input
                            id="folder-name"
                            placeholder="Enter folder name"
                            value={name}
                            onChange={(e): void => {
                                setName(e.target.value);
                            }}
                        />
                    </Box>

                    <Box className="mt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!name.trim()}
                            type="submit"
                            variant="primary"
                        >
                            Rename Folder
                        </Button>
                    </Box>
                </Box>
            </form>
        </Modal>
    );
};
