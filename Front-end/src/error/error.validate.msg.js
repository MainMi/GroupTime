const errorValidateMsg = (nameValue = '', value = 0) => {
    return {
        'emptyError': `${nameValue} is not empty`,
        'maxLength': `${nameValue} charcter is too much length`,
        'dataError': `${nameValue} ${value} - is not correct`,
        'emailError': `${nameValue} is incorrect`,
        'passwordError': `${nameValue} is incorrect`,
        'phoneError': `${nameValue} is not correct phone number`,
        'typeError': `${nameValue} is not correct type`,
        'limitError': `${nameValue} is out of range`
    }
}

export const showErrorMsg = (arr, className) => {
    if (arr.length === 0) {
        return
    }
    return arr.map((value, index) => {
        return <p className={className} key={index}>{value}</p>
    })
}

export default errorValidateMsg;
