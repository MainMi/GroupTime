import i18n from '../i18n';

const errorValidateMsg = () => ({
    emptyError: i18n.t('inputValidation.empty'),
    maxLength: i18n.t('inputValidation.maxLength'),
    dataError: i18n.t('inputValidation.data'),
    emailError: i18n.t('inputValidation.email'),
    passwordError: i18n.t('inputValidation.password'),
    phoneError: i18n.t('inputValidation.phone'),
    typeError: i18n.t('inputValidation.type'),
    limitError: i18n.t('inputValidation.limit'),
});

export const showErrorMsg = (arr, className) => {
    if (arr.length === 0) {
        return
    }
    return arr.map((value, index) => {
        return <p className={className} key={index}>{value}</p>
    })
}

export default errorValidateMsg;
