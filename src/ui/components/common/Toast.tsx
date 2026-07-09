import React, {
    createContext,
    use,
    useCallback,
    useMemo,
    useState,
} from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const TOAST_ICONS = {
    success: <CheckCircle2 className="text-green-400" size={18} />,
    error: <AlertCircle className="text-red-400" size={18} />,
    info: <Info className="text-blue-400" size={18} />,
};
const TOAST_BG_COLORS = {
    success: 'bg-success-muted border-success/30',
    error: 'bg-danger-muted border-danger/30',
    info: 'bg-primary-muted border-primary/30',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info'): void => {
            const id =
                Math.random().toString(36).slice(7) + Date.now().toString(36);
            setToasts((prev): Toast[] => [...prev, { id, message, type }]);

            setTimeout((): void => {
                setToasts((prev): Toast[] =>
                    prev.filter((t): boolean => t.id !== id),
                );
            }, 5000);
        },
        [],
    );

    const removeToast = useCallback((id: string): void => {
        setToasts((prev): Toast[] => prev.filter((t): boolean => t.id !== id));
    }, []);
    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Box className="pointer-events-none fixed right-4 bottom-4 z-[var(--z-index-toast)] flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={(): void => {
                                removeToast(toast.id);
                            }}
                        />
                    ))}
                </AnimatePresence>
            </Box>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
    const context = use(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastItem = ({
    toast,
    onClose,
}: {
    toast: Toast;
    onClose: () => void;
}) => (
    <m.div
        layout
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`pointer-events-auto flex max-w-md min-w-[300px] items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${TOAST_BG_COLORS[toast.type]}`}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
    >
        <div className="shrink-0">{TOAST_ICONS[toast.type]}</div>
        <Text className="flex-1 text-foreground/90" size="sm" weight="medium">
            {toast.message}
        </Text>
        <Button
            className="h-6 w-6 shrink-0 border-none p-0 hover:bg-white/5"
            size="sm"
            variant="ghost"
            onClick={onClose}
        >
            <X size={14} />
        </Button>
    </m.div>
);
