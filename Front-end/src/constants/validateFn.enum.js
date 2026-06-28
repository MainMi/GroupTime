import regex from "./regex.enum"
import constants from "./calendarEnum"

// Keep in sync with the backend event validator (link pattern).
const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;

export const isUrlFn = (value) => {
  if (!value || value.trim() === '') return [];
  return URL_PATTERN.test(value.trim()) ? [] : ['typeError'];
}

export const isUrlOrEmptyFn = (value) => {
  if (!value || value.trim() === '') return [];
  return URL_PATTERN.test(value.trim()) ? [] : ['typeError'];
}


export const validateFn = {
    
    isNotEmptyFn: (value) => value.trim() === '' ? ['emptyError'] : [],

    isDataFn: (value, type) => {
        switch (type) {
            case 'day':
                return value < 1 || value > 31 ? ['dataError'] : []
            case 'month':
                return value < 1 || value > 12 ? ['dataError'] : []
            case 'year':
                return value < constants.minBirthdayYear || value > constants.maxBirthdayYear ? ['dataError'] : []
            default:
                console.error('Incorrect type')
                break;
        }
    },

    isEmailFn: (value) => {
        const regexEmail = new RegExp(regex.REGEX_EMAIL);
        return !regexEmail.test(value) ? ['emailError'] : []
    },

    isPasswordFn: (value) => {
        const regexEmail = new RegExp(regex.REGEX_PASSWORD);
        return !regexEmail.test(value) ? ['passwordError'] : []
    },
    isNumberFn: (value, min, max) => {
        if (Number.isNaN(+value)) {
            return ['typeError']
        } else if (value < min || value > max) {
            return ['limitError']
        }
        return []
    } 
}

export default validateFn;
