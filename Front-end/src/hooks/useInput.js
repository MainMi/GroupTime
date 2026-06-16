import { useState, useCallback } from 'react';
import errorValidateMsg from '../error/error.validate.msg';

const useInput = (validateFn = false, nameValue, initialValue = '') => {
    const [enteredValue, setEnteredValue] = useState(initialValue);
    const [isTouch, setIsTouch] = useState(false);

    const errorArrMsg = errorValidateMsg(nameValue, enteredValue);
    let arrayValidate = validateFn ? validateFn(enteredValue) : [];
    arrayValidate = arrayValidate.map((value) => errorArrMsg[value]);

    const checkError = arrayValidate.length && isTouch;

    const valueChangeHandler = useCallback((event) => {
        setEnteredValue(event.target.value);
    }, []);

    const setValueHandler = useCallback((data) => {
        setEnteredValue(data);
    }, []);

    const inputBlurHandler = useCallback(() => {
        setIsTouch(true);
    }, []);

    const resetFn = useCallback(() => {
        setEnteredValue('');
        setIsTouch(false);
    }, []);

    return {
        value: enteredValue,
        isValidInput: !(arrayValidate.length),
        arrayError: checkError ? arrayValidate : [],
        valueChangeHandler,
        setValueHandler,
        inputBlurHandler,
        resetFn,
    };
};

export default useInput;
