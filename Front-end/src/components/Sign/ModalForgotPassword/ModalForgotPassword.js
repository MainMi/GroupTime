import classes from './ModalForgotPassword.module.scss'

import Input from '../../../UI/Input/Input'
import Modal from '../../../UI/Modal/Modal'
import Button from '../../../UI/Button/Button'
import useInput from '../../../hooks/useInput'
import validateFn from '../../../constants/validateFn.enum'
import { showErrorMsg } from '../../../error/error.validate.msg'
import { requestPasswordReset } from '../../../api/actionFetch'
import { notifySuccess } from '../../../helper/notify'
import { useTranslation } from 'react-i18next'

const ModalForgotPassword = ({ onHiddenCart, defaultEmail = '' }) => {
    const { t } = useTranslation();

    const {
        value: valueEmail,
        isValidInput: isValidEmail,
        arrayError: arrayErrorEmail,
        valueChangeHandler: emailChangeHandler,
        inputBlurHandler: emailBlurHandler,
    } = useInput((value) => {
        const arrValidEmpty = validateFn.isNotEmptyFn(value)
        const arrValidEmail = validateFn.isEmailFn(value);
        return [...arrValidEmpty, ...arrValidEmail]
    }, 'Email', defaultEmail);

    const sendHandler = async (ev) => {
        const result = await requestPasswordReset(valueEmail);
        if (result?.ok) {
            notifySuccess(t('sign.forgotPasswordSent'));
            onHiddenCart(ev);
        }
    };

    return <Modal onHiddenCart={onHiddenCart}>
        <div className={classes.content}>
            <h3>{t('sign.forgotPasswordTitle')}</h3>
            <p>{t('sign.forgotPasswordText')}</p>
            <Input
                value={valueEmail}
                onChange={emailChangeHandler}
                onBlur={emailBlurHandler}
                label={t('sign.email')}
                placeholder={t('sign.emailPlaceholder')}
            />
            {showErrorMsg(arrayErrorEmail, classes.errorMsg)}
            <div className={classes.buttonBox}>
                <Button onClick={onHiddenCart}>{t('password.exit')}</Button>
                <Button
                    typeColor='green'
                    disabled={!isValidEmail}
                    onClick={sendHandler}
                >{t('common.send')}</Button>
            </div>
        </div>
    </Modal>
}

export default ModalForgotPassword;
