import classes from './ModalPassword.module.scss'

import Checkbox from "../../../UI/Checkbox/Checkbox"
import Input from "../../../UI/Input/Input"
import Modal from "../../../UI/Modal/Modal"
import Button from '../../../UI/Button/Button'
import useInput from '../../../hooks/useInput'
import regex from '../../../constants/regex.enum'
import { useTranslation } from 'react-i18next'

const ModalPassword = (props) => {
    const { t } = useTranslation();

    const {
        value,
        passwordChanger,
        onHiddenCart
    } = props;

    const {
        value: passwordValue,
        valueChangeHandler: passwordChangeHandler,
        inputBlurHandler: passwordBlurHandler
    } = useInput('', 'password', value);
    const isRegex = (pattern) => {
        const regex = new RegExp(pattern)
        return regex.test(passwordValue);
    }
    const isLenghtChar = isRegex(regex.REGEX_LENGTH_CHAR);
    const isLowerChar = isRegex(regex.REGEX_LOWER_CHAR);
    const isUpperChar = isRegex(regex.REGEX_UPPER_CHAR);
    const isNumberChar = isRegex(regex.REGEX_NUMBER_CHAR);
    const isSpecialChar = isRegex(regex.REGEX_SPECIAL_CHAR);
    const isPassword = isLenghtChar
        && isLowerChar
        && isUpperChar
        && isNumberChar
        && isSpecialChar;

    return <Modal onHiddenCart={onHiddenCart}>
        <div className={classes.content}>
            <Input value={passwordValue} onChange={passwordChangeHandler} onBlur={passwordBlurHandler} label={t('password.label')} type='password' placeholder={t('password.placeholder')}></Input>
            <div className={classes.checkBoxList}>
                <Checkbox
                    checked={isLenghtChar}
                    readOnly={true}
                >{t('password.min8')}</Checkbox>
                <Checkbox
                    checked={isLowerChar}
                    readOnly={true}
                >{t('password.lower')}</Checkbox>
                <Checkbox
                    checked={isUpperChar}
                    readOnly={true}
                >{t('password.upper')}</Checkbox>
                <Checkbox
                    checked={isNumberChar}
                    readOnly={true}
                >{t('password.digit')}</Checkbox>
                <Checkbox
                    checked={isSpecialChar}
                    readOnly={true}
                >{t('password.special')}</Checkbox>
                <Checkbox
                    checked={isSpecialChar}
                    readOnly={true}
                >{t('password.allowedOnly')}</Checkbox>
            </div>
            <div className={classes.buttonBox}>
                <Button onClick={onHiddenCart}>{t('password.exit')}</Button>
                <Button typeColor='green' active={isPassword} disabled={!isPassword} onClick={(ev) => {
                    passwordChanger(passwordValue);
                    onHiddenCart(ev);
                }}>{t('password.confirm')}</Button>
            </div>
        </div>
    </Modal>
}

export default ModalPassword;