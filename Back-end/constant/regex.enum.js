module.exports = {
    REGEX_GROUP: /[а-яА-я,І,0-9][а-яА-я,І,0-9]-[а-яА-я,І,0-9][а-яА-я,І,0-9]?[а-яА-я,І,0-9]?[а-яА-я,І,0-9]/,
    REGEX_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    REGEX_PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,30}$/,
    REGEXP_PHONE: /^(\+\d{1,2}\s?)?1?-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    REGEXP_URL: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/,
    REGEXP_TIME_HOURS: /^([01]\d|2[0-3]):([0-5]\d)$/,
    TIME_REGEX: /\d{1,2}:\d{2}(:\d{2})?/,
    SEARCH_REGEX_AND_FN: (textArr) => {
        let regex = '/^';
        for (const text of textArr) {
            const value = `(?=.*\b${text}\b)`;
            regex += value;
        }
        regex += '.*$/m';
        return regex;
    },
    SEARCH_REGEX_OR_FN: (textArr) => `^(${textArr.join('|')})$`
};
