import React from 'react';

import { ShieldAlert } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';

interface TokenWarningPopoverProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const TokenWarningPopover = ({
    onConfirm,
    onCancel,
}: TokenWarningPopoverProps): React.ReactNode => (
    <div className="absolute bottom-full left-4 z-[var(--z-index-popover)] mb-2">
        <Box className="w-80 rounded-lg border border-border-subtle bg-bg-primary p-4 shadow-2xl">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-md bg-danger/10 p-2 text-danger">
                    <ShieldAlert size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                        Hold on!
                    </Text>
                    <Text as="p" className="mt-1 text-sm text-muted-foreground">
                        Your message contains a sensitive token. Anyone with it can log into your account without a password and without 2FA!
                    </Text>
                    <div className="mt-3 flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={onConfirm}
                        >
                            I know what I&apos;m doing
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </Box>
    </div>
);
