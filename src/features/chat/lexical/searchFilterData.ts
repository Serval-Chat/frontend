import type { Category, Channel } from '@/api/servers/servers.types';

import { type SearchFilterData } from './SearchFilterNode';

export const TOKEN_RE =
    /(^|\s)(-?)(from|mentions|has|pinned|before|after|strict|type|in|inc):(\S+)(?=\s)/;

export function makeFilterData(
    neg: string,
    key: string,
    val: string,
    channels: Channel[],
    categories: Category[],
): SearchFilterData | null {
    const negated = neg === '-';
    switch (key) {
        case 'from': {
            return {
                filterKey: negated ? 'notFromUser' : 'fromUser',
                filterValue: val,
                label: 'from',
                display: val,
                negated,
            };
        }
        case 'mentions': {
            return {
                filterKey: negated ? 'notMentionsUser' : 'mentionsUser',
                filterValue: val,
                label: 'mentions',
                display: val,
                negated,
            };
        }
        case 'has': {
            if (val === 'file')
                return {
                    filterKey: negated ? 'notHasFile' : 'hasFile',
                    filterValue: true,
                    label: 'has',
                    display: 'file',
                    negated,
                };
            if (val === 'embed')
                return {
                    filterKey: negated ? 'notHasEmbed' : 'hasEmbed',
                    filterValue: true,
                    label: 'has',
                    display: 'embed',
                    negated,
                };
            if (val === 'link')
                return {
                    filterKey: negated ? 'notHasLink' : 'hasLink',
                    filterValue: true,
                    label: 'has',
                    display: 'link',
                    negated,
                };
            return null;
        }
        case 'pinned': {
            return negated
                ? {
                      filterKey: 'notIsPinned',
                      filterValue: val !== 'false',
                      label: 'pinned',
                      display: val,
                      negated: true,
                  }
                : {
                      filterKey: 'isPinned',
                      filterValue: val !== 'false',
                      label: 'pinned',
                      display: val,
                      negated: false,
                  };
        }
        case 'type': {
            if (val === 'user' || val === 'bot' || val === 'webhook')
                return {
                    filterKey: negated ? 'notAuthorType' : 'authorType',
                    filterValue: val,
                    label: 'type',
                    display: val,
                    negated,
                };
            return null;
        }
        case 'strict': {
            return {
                filterKey: negated ? 'notStrict' : 'strict',
                filterValue: val,
                label: 'strict',
                display: val,
                negated,
            };
        }
        case 'before': {
            return negated
                ? null
                : {
                      filterKey: 'before',
                      filterValue: val,
                      label: 'before',
                      display: val,
                      negated: false,
                  };
        }
        case 'after': {
            return negated
                ? null
                : {
                      filterKey: 'after',
                      filterValue: val,
                      label: 'after',
                      display: val,
                      negated: false,
                  };
        }
        case 'in': {
            if (negated) return null;
            const ch = channels.find((c) => c.id === val);
            return {
                filterKey: 'inChannel',
                filterValue: val,
                label: 'in',
                display: ch ? `#${ch.name}` : `#${val}`,
                negated: false,
            };
        }
        case 'inc': {
            const cat = categories.find((c) => c.id === val);
            return {
                filterKey: negated ? 'notInCategory' : 'inCategory',
                filterValue: cat?.id ?? val,
                label: 'inc',
                display: cat ? cat.name : val,
                negated,
            };
        }
        default: {
            return null;
        }
    }
}
