import regex from "../constants/regex.enum"

export const validateFn = {
    isEmptyFn: (value) => true,
    isNotEmptyFn: (value) => value.trim() === '' ? 'This value is not empty' : '',
    isEmailFn: (value) => {
        const regexEmail = new RegExp(regex.REGEX_EMAIL);
        return !regexEmail.test(value) ? 'Email is not valid' : ''
    },
    isPasswordFn: (value) => {
        const regexPassword = new RegExp(regex.REGEX_PASSWORD);
        return !regexPassword.test(value) ? 'Password is not valid' : ''
    },
    isPhoneFn: (value) => {
        const regexPhone = new RegExp(regex.REGEX_PHONE);
        return !regexPhone.test(value) ? 'Phone is not valid' : ''
    },
}

export default validateFn;