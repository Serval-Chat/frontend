// please dont cancel me for this
// i just wanted to make it look like roblox

const CENSORED_WORDS = new Set([
    'hi',
    'hello',
    'hey',
    'yo',
    'fuck',
    'shit',
    'ass',
    'bitch',
    'damn',
    'hell',
    'bastard',
    'crap',
    'idiot',
    'stupid',
    'noob',
    'gay',
    'lesbian',
    'trans',
    'dick',
    'pussy',
    'cum',
    'sex',
    'porn',
    'nigger',
    'faggot',
    'retard',
    'kys',
    'discord',
    'roblox',
    'minecraft',
    'fortnite',
    'social',
    'media',
    'phone',
    'number',
    'address',
    'email',
    'password',
    'hack',
    'cheat',
    'scam',
    'buy',
    'sell',
    'free',
    'robux',
    'vbucks',
    'gift',
    'card',
    'link',
    'dot',
    'com',
    'net',
    'org',
    'edu',
    'gov',
    'mil',
    'co',
    'uk',
    'us',
    'ca',
    'au',
    'nz',
    'de',
    'fr',
    'it',
    'es',
    'br',
    'mx',
    'ru',
    'jp',
    'cn',
    'in',
    'kr',
    'fag',
    'cunt',
    'meow',
    'mrrp',
    'nyaa',
    'nya',
    'rawr',
    'uwu',
    'owo',
]);

const RANDOM_CENSOR_CHANCE = 0.3;

function hashWord(word: string): string {
    return '#'.repeat(word.length);
}

export function censorText(text: string): string {
    if (!text) return text;

    return text.replace(/([a-zA-Z0-9]+)/g, (word) => {
        const lowerWord = word.toLowerCase();

        if (CENSORED_WORDS.has(lowerWord)) {
            return hashWord(word);
        }

        if (Math.random() < RANDOM_CENSOR_CHANCE) {
            return hashWord(word);
        }

        return word;
    });
}
