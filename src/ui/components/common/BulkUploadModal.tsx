import { Loader2 } from 'lucide-react';

import { Button } from './Button';
import { Modal } from './Modal';
import { Text } from './Text';

interface BulkUploadModalProps {
    isOpen: boolean;
    total: number;
    uploaded: number;
    errors: number;
    title: string;
    onClose: () => void;
    onCancel?: () => void;
    isCancelling?: boolean;
}

export const BulkUploadModal = ({
    isOpen,
    total,
    uploaded,
    errors,
    title,
    onClose,
    onCancel,
    isCancelling = false,
}: BulkUploadModalProps) => {
    const isFinished = uploaded + errors === total && total > 0;
    const progress = total > 0 ? ((uploaded + errors) / total) * 100 : 0;

    return (
        <Modal
            className="max-w-md"
            isOpen={isOpen}
            showCloseButton={isFinished ? !isCancelling : false}
            title={title}
            onClose={isFinished ? onClose : (): void => {}}
        >
            <div className="space-y-8 py-2">
                <div className="space-y-3">
                    <div className="flex items-end justify-between">
                        <Text variant="muted" weight="medium">
                            {isCancelling
                                ? 'Cancelling and cleaning up...'
                                : isFinished
                                  ? 'Bulk upload complete'
                                  : 'Processing files...'}
                        </Text>
                        <Text size="lg" variant="primary" weight="bold">
                            {Math.round(progress)}%
                        </Text>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-border-subtle shadow-inner">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-bg-subtle/50 p-3">
                        <Text size="xl" weight="bold">
                            {total}
                        </Text>
                        <Text
                            className="font-bold tracking-widest uppercase"
                            size="xs"
                            variant="muted"
                        >
                            Total
                        </Text>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-green-500/5 p-3">
                        <Text
                            className="text-green-500"
                            size="xl"
                            weight="bold"
                        >
                            {uploaded}
                        </Text>
                        <Text
                            className="font-bold tracking-widest uppercase"
                            size="xs"
                            variant="muted"
                        >
                            Success
                        </Text>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-red-500/5 p-3">
                        <Text className="text-red-500" size="xl" weight="bold">
                            {errors}
                        </Text>
                        <Text
                            className="font-bold tracking-widest uppercase"
                            size="xs"
                            variant="muted"
                        >
                            Failed
                        </Text>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    {!isFinished && !isCancelling && onCancel ? (
                        <Button
                            className="min-w-[100px]"
                            variant="danger"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    ) : null}
                    {isCancelling ? (
                        <div className="flex items-center gap-2 pr-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cleaning up...
                        </div>
                    ) : null}
                    {isFinished && !isCancelling ? (
                        <Button
                            className="min-w-[100px]"
                            variant="primary"
                            onClick={onClose}
                        >
                            Finish
                        </Button>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
};
