import type { ReactDoctorConfig } from 'react-doctor/api';

export default {
    rules: {
        'react-doctor/iframe-missing-sandbox': 'off',
    },
    ignore: {
        files: [
            'src/api/generated/**',
            'public/docs/**',
        ],
    },
} satisfies ReactDoctorConfig;
