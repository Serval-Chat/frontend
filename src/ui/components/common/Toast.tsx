import React, { createContext, useCallback, useContext, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id =
                Math.random().toString(36).substring(7) +
                Date.now().toString(36);
            setToasts((prev) => [...prev, { id, message, type }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000);
        },
        [],
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Box className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </Box>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({
    toast,
    onClose,
}) => {
    const icons = {
        success: <CheckCircle2 className="text-green-400" size={18} />,
        error: <AlertCircle className="text-red-400" size={18} />,
        info: <Info className="text-blue-400" size={18} />,
    };

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    return (
        <motion.div
            layout
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg min-w-[300px] max-w-md ${bgColors[toast.type]}`}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <Text
                className="flex-1 text-foreground/90"
                size="sm"
                weight="medium"
            >
                {toast.message}
            </Text>
            <Button
                className="shrink-0 h-6 w-6 p-0 hover:bg-white/5 border-none"
                size="sm"
                variant="ghost"
                onClick={onClose}
            >
                <X size={14} />
            </Button>
        </motion.div>
    );
};
