export interface CustomThemeFile {
    id: string;
    name: string;
    css: string;
    sourceCss: string;
    scopeAttribute: string;
    createdAt: string;
    updatedAt: string;
    metadata?: {
        name?: string;
        author?: string;
        description?: string;
    };
}

export interface CustomThemeDraft {
    id?: string;
    name: string;
    css: string;
}

const CUSTOM_THEMES_STORAGE_KEY = 'serchat.customThemes';
const CUSTOM_THEME_SCOPE_PLACEHOLDER = 'data-custom-theme';
const CUSTOM_THEME_SCOPE_PATTERN = /data-serchat-theme-[a-z0-9]+-[a-z0-9]+/g;

const createCustomThemeScopeAttribute = (): string =>
    `data-serchat-theme-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

const preprocessCustomThemeCss = (
    css: string,
    scopeAttribute: string,
): string =>
    css
        .replaceAll(CUSTOM_THEME_SCOPE_PLACEHOLDER, scopeAttribute)
        .replace(CUSTOM_THEME_SCOPE_PATTERN, scopeAttribute);

const restoreCustomThemeCss = (css: string, scopeAttribute: string): string =>
    css.replaceAll(scopeAttribute, CUSTOM_THEME_SCOPE_PLACEHOLDER);

/**
 * Extract metadata from CSS theme file comments.
 * Looks for @name, @author, and @description tags in comments.
 */
const extractThemeMetadata = (
    css: string,
): {
    name?: string;
    author?: string;
    description?: string;
} => {
    const metadata: { name?: string; author?: string; description?: string } =
        {};

    // Match the first comment block
    const commentMatch = css.match(/\/\*[\s\S]*?\*\//);
    if (!commentMatch) return metadata;

    const comment = commentMatch[0];

    // Extract @name
    const nameMatch = comment.match(/@name\s+(.+)/);
    if (nameMatch) {
        metadata.name = nameMatch[1].trim();
    }

    // Extract @author
    const authorMatch = comment.match(/@author\s+(.+)/);
    if (authorMatch) {
        metadata.author = authorMatch[1].trim();
    }

    // Extract @description (can be multiline)
    const descMatch = comment.match(/@description\s+([\s\S]+?)(?=@\w+|$|\*\/)/);
    if (descMatch) {
        metadata.description = descMatch[1]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\*\//g, '');
    }

    return metadata;
};

const isCustomThemeFile = (value: unknown): value is CustomThemeFile => {
    if (!value || typeof value !== 'object') return false;

    const maybeTheme = value as Record<string, unknown>;
    return (
        typeof maybeTheme.id === 'string' &&
        typeof maybeTheme.name === 'string' &&
        typeof maybeTheme.css === 'string' &&
        (typeof maybeTheme.sourceCss === 'string' ||
            maybeTheme.sourceCss === undefined) &&
        (typeof maybeTheme.scopeAttribute === 'string' ||
            maybeTheme.scopeAttribute === undefined) &&
        typeof maybeTheme.createdAt === 'string' &&
        typeof maybeTheme.updatedAt === 'string'
    );
};

const normalizeCustomThemeFile = (theme: CustomThemeFile): CustomThemeFile => {
    const scopeAttribute =
        theme.scopeAttribute || createCustomThemeScopeAttribute();
    const sourceCss =
        theme.sourceCss || restoreCustomThemeCss(theme.css, scopeAttribute);

    return {
        ...theme,
        scopeAttribute,
        sourceCss,
        css: preprocessCustomThemeCss(sourceCss, scopeAttribute),
    };
};

export const readCustomThemes = (): CustomThemeFile[] => {
    try {
        const saved = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
        if (!saved) return [];

        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(isCustomThemeFile).map(normalizeCustomThemeFile);
    } catch {
        return [];
    }
};

export const writeCustomThemes = (themes: CustomThemeFile[]): void => {
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
};

export const createCustomThemeId = (): string =>
    `theme-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

export const createCustomThemeFile = (
    draft: CustomThemeDraft,
): CustomThemeFile => {
    const now = new Date().toISOString();
    const scopeAttribute = createCustomThemeScopeAttribute();
    const metadata = extractThemeMetadata(draft.css);

    return {
        id: draft.id ?? createCustomThemeId(),
        name: metadata.name || draft.name.trim(),
        sourceCss: draft.css,
        css: preprocessCustomThemeCss(draft.css, scopeAttribute),
        scopeAttribute,
        createdAt: now,
        updatedAt: now,
        metadata,
    };
};

export const updateCustomThemeFile = (
    existing: CustomThemeFile,
    draft: CustomThemeDraft,
): CustomThemeFile => {
    const metadata = extractThemeMetadata(draft.css);

    return {
        ...existing,
        name: metadata.name || draft.name.trim(),
        sourceCss: draft.css,
        css: preprocessCustomThemeCss(draft.css, existing.scopeAttribute),
        updatedAt: new Date().toISOString(),
        metadata,
    };
};
