import type { ReactDoctorConfig } from 'react-doctor/api';

export default {
    rules: {
        // False positive: our only iframe has already proper sandbox attributes 
        'react-doctor/iframe-missing-sandbox': 'off',
    },
} satisfies ReactDoctorConfig;
