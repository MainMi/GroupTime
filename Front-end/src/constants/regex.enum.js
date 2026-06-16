const regex = {
    REGEX_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    REGEX_PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    REGEX_PHONE: /^(\+\d{1,2}\s?)?1?-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    REGEX_LOWER_CHAR: /^(?=.*[a-z])/,
    REGEX_UPPER_CHAR: /^(?=.*[A-Z])/,
    REGEX_NUMBER_CHAR: /^(?=.*[0-9])/,
    REGEX_SPECIAL_CHAR: /^(?=.*[@$!%*#?&])/,
    REGEX_LENGTH_CHAR: /^(?=.{8,})/,
    TIME_REGEX: /\d{1,2}:\d{2}(:\d{2})?/
}

export default regex;