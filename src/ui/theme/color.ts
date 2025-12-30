export const buttonColors = {
    normal: 'bg-blue-500 hover:bg-blue-600',
    danger: 'bg-red-500 hover:bg-red-600',
    caution: 'bg-yellow-500 hover:bg-yellow-600',
    success: 'bg-green-500 hover:bg-green-600',
} as const;

export const muteButtonColors = {
    normal: 'bg-blue-200 hover:bg-blue-300',
    danger: 'bg-red-200 hover:bg-red-300',
    caution: 'bg-yellow-200 hover:bg-yellow-300',
    success: 'bg-green-200 hover:bg-green-300',
} as const;

export const mutedColors = {
    blue: {
        bg: 'bg-blue-200',
        text: 'text-blue-800',
        hover: 'hover:bg-blue-300',
    },
    red: { bg: 'bg-red-200', text: 'text-red-800', hover: 'hover:bg-red-300' },
    yellow: {
        bg: 'bg-yellow-200',
        text: 'text-yellow-800',
        hover: 'hover:bg-yellow-300',
    },
    green: {
        bg: 'bg-green-200',
        text: 'text-green-800',
        hover: 'hover:bg-green-300',
    },
} as const;
