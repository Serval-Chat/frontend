import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { useChannels, useServerDetails } from '@/api/servers/servers.queries';
import { useUserById } from '@/api/users/users.queries';

const SITE_URL = 'https://ser.chat';
const SITE_NAME = 'Serchat';
const DEFAULT_TITLE = 'Serchat - Modern Community Chat';
const DEFAULT_DESCRIPTION =
    'Serchat is a modern chat app for communities and your servals.';
const DEFAULT_IMAGE = `${SITE_URL}/serval.png`;

type ChatTitleContext =
    | { type: 'dm'; userId: string }
    | { type: 'channel'; serverId: string; channelId: string }
    | { type: 'server'; serverId: string };

const getChatTitleContext = (
    pathname: string,
): ChatTitleContext | undefined => {
    const segments = pathname.split('/');

    if (segments[1] === 'chat' && segments[2] === '@user' && segments[3]) {
        return { type: 'dm', userId: segments[3] };
    }

    if (segments[1] !== 'chat' || segments[2] !== '@server' || !segments[3]) {
        return undefined;
    }

    if (segments[4] === 'channel' && segments[5]) {
        return {
            type: 'channel',
            serverId: segments[3],
            channelId: segments[5],
        };
    }

    return { type: 'server', serverId: segments[3] };
};

interface SeoConfig {
    title: string;
    description: string;
    canonicalPath?: string;
    noindex?: boolean;
}

const publicSeo: Record<string, SeoConfig> = {
    '/': {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        canonicalPath: '/',
    },
    '/downloads': {
        title: 'Download Serchat - Windows, Linux, and Android',
        description:
            'Download Serchat for Windows, Linux, and Android and chat from your desktop or phone.',
        canonicalPath: '/downloads',
    },
};

const getSeoConfig = (pathname: string): SeoConfig => {
    const normalizedPath = pathname === '' ? '/' : pathname;
    const exactMatch = publicSeo[normalizedPath];
    if (exactMatch) return exactMatch;

    return {
        title: `${SITE_NAME} - App`,
        description: DEFAULT_DESCRIPTION,
        noindex: true,
    };
};

const setMeta = (
    selector: string,
    attribute: 'content' | 'href',
    value: string,
    createElement?: () => HTMLMetaElement | HTMLLinkElement,
): void => {
    let element = document.head.querySelector<
        HTMLMetaElement | HTMLLinkElement
    >(selector);

    if (!element && createElement) {
        element = createElement();
        document.head.append(element);
    }

    element?.setAttribute(attribute, value);
};

const ensureMetaName = (name: string): HTMLMetaElement => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', name);
    return meta;
};

const ensureMetaProperty = (property: string): HTMLMetaElement => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', property);
    return meta;
};

const ensureCanonical = (): HTMLLinkElement => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    return link;
};

export const Seo = (): null => {
    const { pathname } = useLocation();
    const chatContext = getChatTitleContext(pathname);
    const friendId = chatContext?.type === 'dm' ? chatContext.userId : '';
    const serverId =
        chatContext?.type === 'dm' ? null : (chatContext?.serverId ?? null);
    const channelId =
        chatContext?.type === 'channel' ? chatContext.channelId : null;

    const { data: friend } = useUserById(friendId, {
        enabled: !!friendId,
    });
    const { data: server } = useServerDetails(serverId, {
        enabled: !!serverId,
    });
    const { data: channels } = useChannels(serverId, {
        enabled: !!channelId,
    });

    const channel = channels?.find(
        (item): boolean => item.id === channelId && item.serverId === serverId,
    );
    const serverName = server?.id === serverId ? server.name : undefined;
    const chatTitle =
        chatContext?.type === 'dm' && friend?.username
            ? `${SITE_NAME} | @${friend.username}`
            : chatContext?.type === 'channel' && channel?.name
              ? `${SITE_NAME} | #${channel.name}`
              : chatContext?.type === 'server' && serverName
                ? `${SITE_NAME} | ${serverName}`
                : undefined;

    useEffect((): void => {
        const config = getSeoConfig(pathname);
        const canonicalUrl = config.canonicalPath
            ? `${SITE_URL}${config.canonicalPath}`
            : `${SITE_URL}${pathname}`;
        const robots = config.noindex ? 'noindex, nofollow' : 'index, follow';

        document.title = chatTitle ?? config.title;

        setMeta(
            'meta[name="description"]',
            'content',
            config.description,
            (): HTMLMetaElement => ensureMetaName('description'),
        );
        setMeta(
            'meta[name="robots"]',
            'content',
            robots,
            (): HTMLMetaElement => ensureMetaName('robots'),
        );
        setMeta('link[rel="canonical"]', 'href', canonicalUrl, ensureCanonical);

        setMeta(
            'meta[property="og:title"]',
            'content',
            chatTitle ?? config.title,
            (): HTMLMetaElement => ensureMetaProperty('og:title'),
        );
        setMeta(
            'meta[property="og:description"]',
            'content',
            config.description,
            (): HTMLMetaElement => ensureMetaProperty('og:description'),
        );
        setMeta(
            'meta[property="og:url"]',
            'content',
            canonicalUrl,
            (): HTMLMetaElement => ensureMetaProperty('og:url'),
        );
        setMeta(
            'meta[property="og:image"]',
            'content',
            DEFAULT_IMAGE,
            (): HTMLMetaElement => ensureMetaProperty('og:image'),
        );

        setMeta(
            'meta[name="twitter:title"]',
            'content',
            chatTitle ?? config.title,
            (): HTMLMetaElement => ensureMetaName('twitter:title'),
        );
        setMeta(
            'meta[name="twitter:description"]',
            'content',
            config.description,
            (): HTMLMetaElement => ensureMetaName('twitter:description'),
        );
        setMeta(
            'meta[name="twitter:image"]',
            'content',
            DEFAULT_IMAGE,
            (): HTMLMetaElement => ensureMetaName('twitter:image'),
        );
    }, [chatTitle, pathname]);

    return null;
};
