import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Sparkles } from 'lucide-react';

import { decorationsApi } from '@/api/decorations';
import { useMe } from '@/api/users/users.queries';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';
import { Button } from '@/ui/components/common/Button';
import { PausedAnimatedImage } from '@/ui/components/common/PausedAnimatedImage';
import { useToast } from '@/ui/components/common/Toast';

interface DecorationEmbedProps {
    decorationId: string;
}

export const DecorationEmbed = ({ decorationId }: DecorationEmbedProps) => {
    const { data: user } = useMe();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const limitedAnimations = useLimitedAnimations();
    const [isHovered, setIsHovered] = useState(false);

    const {
        data: decoration,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['decoration', decorationId],
        queryFn: () => decorationsApi.get(decorationId),
        retry: false,
    });

    const applyMutation = useMutation({
        mutationFn: decorationsApi.apply,
        onSuccess: () => {
            showToast('Decoration applied!', 'success');
            void queryClient.invalidateQueries({ queryKey: ['me'] });
        },
        onError: () => {
            showToast('Failed to apply decoration.', 'error');
        },
    });

    if (isLoading) {
        return (
            <div className="mt-2 w-72 max-w-full animate-pulse rounded-xl border border-border-subtle bg-bg-subtle p-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-bg-secondary" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-bg-secondary" />
                        <div className="h-3 w-1/2 rounded bg-bg-secondary" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !decoration) {
        return null;
    }

    const isActive = user?.decorationId === decoration.id;

    return (
        <div
            className="mt-2 flex w-72 max-w-full flex-col gap-3 rounded-xl border border-border-subtle bg-bg-subtle p-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-bg-secondary">
                        {user?.profilePicture ? (
                            <img
                                alt=""
                                className="h-full w-full object-cover"
                                src={user.profilePicture}
                            />
                        ) : (
                            <span className="text-xl font-bold text-muted-foreground opacity-50">
                                {user?.username?.[0]?.toUpperCase() ?? '?'}
                            </span>
                        )}
                    </div>
                    <PausedAnimatedImage
                        alt=""
                        className="pointer-events-none absolute inset-0 z-10 h-full w-full scale-125 object-cover"
                        paused={limitedAnimations || !isHovered}
                        src={`/api/v1/decorations/file/${decoration.id}?size=64`}
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="mb-1 flex items-center gap-1 text-xs font-bold tracking-wider text-primary uppercase">
                        <Sparkles size={12} /> Decoration
                    </span>
                    <span
                        className="truncate text-sm font-semibold text-foreground"
                        title={decoration.name}
                    >
                        {decoration.name}
                    </span>
                </div>
            </div>
            <Button
                fullWidth
                disabled={isActive || applyMutation.isPending}
                icon={isActive ? Check : undefined}
                size="sm"
                variant={isActive ? 'ghost' : 'primary'}
                onClick={() => applyMutation.mutate(decoration.id)}
            >
                {isActive
                    ? 'Active'
                    : applyMutation.isPending
                      ? 'Applying...'
                      : 'Apply Decoration'}
            </Button>
        </div>
    );
};
