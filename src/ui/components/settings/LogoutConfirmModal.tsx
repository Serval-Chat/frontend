import { useLogout } from '@/api/auth/auth.queries';
import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogoutConfirmModal = ({
    isOpen,
    onClose,
}: LogoutConfirmModalProps) => {
    const { mutate: logout, isPending } = useLogout();
    const { showToast } = useToast();

    const handleLogout = (): void => {
        logout(undefined, {
            onError: (error): void => {
                showToast(
                    extractApiError(
                        error,
                        'Could not reach the server, but you have been signed out on this device.',
                    ),
                    'error',
                );
            },
        });
    };

    return (
        <Modal isOpen={isOpen} title="Log Out" onClose={onClose}>
            <div className="flex flex-col gap-4">
                <Text>Are you sure you want to log out?</Text>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        loading={isPending}
                        variant="danger"
                        onClick={handleLogout}
                    >
                        Log Out
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
