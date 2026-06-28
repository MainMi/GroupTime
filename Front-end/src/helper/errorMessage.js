import i18n from '../i18n';

// Backend errorStatus → localized message key (errors.codes.*).
const ERROR_KEY_BY_STATUS = {
    4001: 'errors.codes.4001',
    4002: 'errors.codes.4002',
    4003: 'errors.codes.4003',
    4004: 'errors.codes.4004',
    4011: 'errors.codes.4011',
    4012: 'errors.codes.4012',
    4013: 'errors.codes.4013',
    4014: 'errors.codes.4014',
    4016: 'errors.codes.4016',
    4017: 'errors.codes.4017',
    4031: 'errors.codes.4031',
    4032: 'errors.codes.4032',
    4033: 'errors.codes.4033',
    4034: 'errors.codes.4034',
    4035: 'errors.codes.4035',
    4036: 'errors.codes.4036',
    4041: 'errors.codes.4041',
    4042: 'errors.codes.4042',
    4043: 'errors.codes.4043',
    4044: 'errors.codes.4044',
    4045: 'errors.codes.4045',
    4046: 'errors.codes.4046',
    4051: 'errors.codes.4051',
    4052: 'errors.codes.4052',
    4053: 'errors.codes.4053',
    4054: 'errors.codes.4054',
    4055: 'errors.codes.4055',
    4056: 'errors.codes.4056',
    4057: 'errors.codes.4057',
    4058: 'errors.codes.4058',
    4059: 'errors.codes.4059',
    4060: 'errors.codes.4060',
    4091: 'errors.codes.4091',
    4092: 'errors.codes.4092',
    4093: 'errors.codes.4093',
    4131: 'errors.codes.4131',
    4132: 'errors.codes.4132',
    4191: 'errors.codes.4191',
    5001: 'errors.codes.5001',
    5002: 'errors.codes.5002',
    5003: 'errors.codes.5003',
};

export const resolveErrorMessage = (data, fallbackKey = 'auth.genericError') => {
    const code = data && data.errorStatus;
    const key = code && ERROR_KEY_BY_STATUS[code];
    if (key) {
        const translated = i18n.t(key);
        if (translated && translated !== key) return translated;
    }
    return (data && data.message) || i18n.t(fallbackKey);
};

export default resolveErrorMessage;
