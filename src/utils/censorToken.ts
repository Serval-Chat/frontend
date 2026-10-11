const PREFIX = 'serchat_';

export const censorToken = (token: string): string => {
    if (token.startsWith(PREFIX)) {
        const rest = token.slice(PREFIX.length);
        return (
            PREFIX + rest.slice(0, 4) + '•'.repeat(Math.max(0, rest.length - 4))
        );
    }
    return token.slice(0, 8) + '•'.repeat(Math.max(0, token.length - 8));
};
