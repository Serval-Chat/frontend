import { useEffect, useMemo, useState } from 'react';

import {
    type ReportUserProfileSnapshot as Snapshot,
    reportsApi,
} from '@/api/reports/reports.api';
import type { User } from '@/api/users/users.types';
import { UserProfileCard } from '@/ui/components/profile/UserProfileCard';

const useSnapshotImage = (
    reportId: string,
    kind: 'avatar' | 'banner',
    available: boolean,
): string | undefined => {
    const [loadedImage, setLoadedImage] = useState<{
        key: string;
        url: string;
    }>();
    const key = `${reportId}:${kind}:${available}`;

    useEffect(() => {
        if (!available) return;

        let active = true;
        let objectUrl: string | undefined;
        void reportsApi
            .snapshotImage(reportId, kind)
            .then((blob) => {
                objectUrl = URL.createObjectURL(blob);
                if (active) {
                    setLoadedImage({ key, url: objectUrl });
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            })
            .catch(() => undefined);

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [available, key, kind, reportId]);

    return loadedImage?.key === key ? loadedImage.url : undefined;
};

export const ReportUserProfileSnapshot = ({
    reportId,
    targetUserId,
    snapshot,
}: {
    reportId: string;
    targetUserId: string;
    snapshot: Snapshot;
}) => {
    const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
    const [isVisible, setIsVisible] = useState(
        () => typeof IntersectionObserver === 'undefined',
    );

    useEffect(() => {
        if (
            !rootElement ||
            isVisible ||
            typeof IntersectionObserver === 'undefined'
        ) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '160px' },
        );
        observer.observe(rootElement);
        return () => observer.disconnect();
    }, [isVisible, rootElement]);

    const avatarUrl = useSnapshotImage(
        reportId,
        'avatar',
        isVisible && snapshot.profilePictureAvailable === true,
    );
    const bannerUrl = useSnapshotImage(
        reportId,
        'banner',
        isVisible && snapshot.bannerAvailable === true,
    );
    const user = useMemo<Partial<User>>(
        () => ({
            id: targetUserId,
            username: snapshot.username,
            displayName: snapshot.displayName,
            profilePicture: avatarUrl,
            banner: bannerUrl,
            bannerColor: snapshot.bannerColor,
            profilePrimaryColor: snapshot.profilePrimaryColor,
            profileAccentColor: snapshot.profileAccentColor,
            usernameFont: snapshot.usernameFont,
            usernameGradient: snapshot.usernameGradient,
            usernameGlow: snapshot.usernameGlow,
            presenceStatus: snapshot.presenceStatus,
            bio: snapshot.bio,
            pronouns: snapshot.pronouns,
            createdAt: snapshot.createdAt
                ? new Date(snapshot.createdAt)
                : undefined,
            isBot: snapshot.isBot,
            botVerified: snapshot.botVerified,
            decorationId: snapshot.decorationId,
            badges: snapshot.badges,
            privacySettings: snapshot.privacySettings,
            connections: snapshot.connections,
        }),
        [avatarUrl, bannerUrl, snapshot, targetUserId],
    );

    if (!isVisible) {
        return (
            <div
                aria-label="Reported profile snapshot"
                className="h-72 w-85 max-w-full rounded-2xl border border-border-subtle bg-bg-secondary"
                ref={setRootElement}
            />
        );
    }

    return (
        <div
            aria-label="Reported profile snapshot"
            className="w-fit max-w-full"
            ref={setRootElement}
        >
            <UserProfileCard
                adminView
                hideActions
                ignoreLivePresence
                className="max-w-full"
                customStatus={snapshot.customStatus}
                presenceStatus={snapshot.presenceStatus ?? 'offline'}
                user={user}
            />
        </div>
    );
};
