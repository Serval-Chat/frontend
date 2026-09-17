export const SERVER_SUBPAGE_PATHS = {
    selfRoles: '/self-roles',
    channelsAndCategories: '/channels-and-categories',
    members: '/members',
} as const;

const ALL_SUFFIXES = Object.values(SERVER_SUBPAGE_PATHS);

export const isServerSubpage = (pathname: string): boolean =>
    ALL_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
