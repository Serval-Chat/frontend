import React, { useState } from 'react';

import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Box } from '@/ui/components/layout/Box';

interface RenameFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onRename: (newName: string) => void;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
    isOpen,
    onClose,
    currentName,
    onRename,
}) => {
    const [name, setName] = useState(currentName);

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
                        <label
                            className="text-text-muted text-[10px] font-bold tracking-wider uppercase"
                            htmlFor="folder-name"
                        >
                            Folder Name
                        </label>
                        <Input
                            id="folder-name"
                            placeholder="Enter folder name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
