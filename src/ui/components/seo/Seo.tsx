import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://ser.chat';
const SITE_NAME = 'Serchat';
const DEFAULT_TITLE = 'Serchat - Modern Community Chat';
const DEFAULT_DESCRIPTION =
    'Serchat is a modern chat app for communities and your servals.';
const DEFAULT_IMAGE = `${SITE_URL}/serval.png`;

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
        document.head.appendChild(element);
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

    useEffect((): void => {
        const config = getSeoConfig(pathname);
        const canonicalUrl = config.canonicalPath
            ? `${SITE_URL}${config.canonicalPath}`
            : `${SITE_URL}${pathname}`;
        const robots = config.noindex ? 'noindex, nofollow' : 'index, follow';

        document.title = config.title;

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
            config.title,
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
            config.title,
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
    }, [pathname]);

    return null;
};
