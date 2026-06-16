import classes from './SignPage.module.scss'
import Button from '../../UI/Button/Button'
import Input from '../../UI/Input/Input';

import patternBig from '../../static/image/pattern/patternBig.svg';
import { Link, useSearchParams } from 'react-router-dom';
import ModalPassword from '../../components/Sign/ModalPassword/ModalPassword';
import HeaderImg from '../../UI/HeaderImg/HeaderImg';
import React, { useState, useEffect } from 'react';
import useInput from '../../hooks/useInput';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { fetchRegister, fetchLogin, fetchUserInfo } from '../../redux/actions/auth-actions';
import validateFn from '../../constants/validateFn.enum';
import { showErrorMsg } from '../../error/error.validate.msg';
import { useTranslation } from 'react-i18next';
import ModalForgotPassword from '../../components/Sign/ModalForgotPassword/ModalForgotPassword';

const SignPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(fetchUserInfo(navigate));
    }, []);

    const [ searchParam ] = useSearchParams();
    const isSignUp = searchParam.get('mode') === 'signUp';
    const signClass = `${classes.signBox} ${isSignUp ? '' : classes.signIn}`;
    const [ isModalPassword, setIsModalPassword ] = useState(false);
    const [ vlPassword, setPasswordValue ] = useState('');

    const passwordChanger = (newValue) => setPasswordValue(newValue);

    const clickPasswordHandler = (ev) => {
        ev.preventDefault();
        setIsModalPassword((prevState) => !prevState);
    }

    const [isModalForgot, setIsModalForgot] = useState(false);

    const forgotPasswordHandler = (ev) => {
        ev.preventDefault();
        setIsModalForgot(true);
    }

    let {
        value: valueEmail,
        isValidInput: isValidEmail,
        arrayError: arrayErrorEmail,
        valueChangeHandler: emailChangeHandler,
        inputBlurHandler: emailBlurHandler,
    } = useInput((value) => {
        const arrValidEmpty = validateFn.isNotEmptyFn(value)
        const arrValidEmail = validateFn.isEmailFn(value);
        return [...arrValidEmpty, ...arrValidEmail]
    }, 'Email');

    let {
        value: valuePassword,
        isValidInput: isValidPassword,
        arrayError: arrayErrorPassword,
        valueChangeHandler: passwordChangeHandler,
        inputBlurHandler: passwordBlurHandler,
    } = useInput((value) => {
        const arrValidEmpty = validateFn.isNotEmptyFn(value)
        const arrValidPassword = validateFn.isPasswordFn(value);
        return [...arrValidEmpty, ...arrValidPassword]
    }, 'Password');



    let {
        value: valueFirstName,
        isValidInput: isValidFirstName,
        arrayError: arrayErrorFirstName,
        valueChangeHandler: firstNameChangeHandler,
        inputBlurHandler: firstNameBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'FirstName');

    let {
        value: valueLastName,
        isValidInput: isValidLastName,
        arrayError: arrayErrorLastName,
        valueChangeHandler: lastNameChangeHandler,
        inputBlurHandler: lastNameBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'LastName');
    let {
        value: valueNickname,
        isValidInput: isValidNickname,
        arrayError: arrayErrorNickname,
        valueChangeHandler: nicknameChangeHandler,
        inputBlurHandler: nicknameBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'Nickname');

    const validateBirthday = (value) => {
        if (!value || value.trim() === '') return ['emptyError'];
        let date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            date = new Date(value);
        } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
            const [d, m, y] = value.split('.');
            date = new Date(`${y}-${m}-${d}`);
        } else {
            return ['dataError'];
        }
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return ['dataError'];
        }
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 100;
        const maxYear = currentYear - 14;
        if (year < minYear || year > maxYear) {
            return ['limitError'];
        }
        return [];
    };

    let {
        value: valueBirthday,
        isValidInput: isValidBirthday,
        arrayError: arrayErrorBirthday,
        valueChangeHandler: birthdayChangeHandler,
        inputBlurHandler: birthdayBlurHandler,
    } = useInput(validateBirthday, 'Birthday');
    
    

    const isValidRegister = isValidFirstName &&
        isValidLastName &&
        isValidNickname &&
        isValidBirthday &&
        isValidEmail &&
        vlPassword
    const isLoginValid = isValidEmail && isValidPassword;

    const registerHandler = async (ev) => {
        ev.preventDefault();

        if (isValidRegister) {
            const registrationData = {
                firstName: valueFirstName,
                lastName: valueLastName,
                nickname: valueNickname,
                birthday: valueBirthday,
                email: valueEmail,
                password: vlPassword,
            };

            dispatch(fetchRegister(registrationData, navigate));
        }
    };

    const loginHandler = async (ev) => {
        ev.preventDefault();

        if (isLoginValid) {
            const loginData = {
                email: valueEmail,
                password: valuePassword,
            };

            dispatch(fetchLogin(loginData, navigate));
        }
    };

    return <div className={classes.content}>
        {isModalPassword && <ModalPassword value={vlPassword} passwordChanger={passwordChanger} onHiddenCart={clickPasswordHandler}/>}
        {isModalForgot && <ModalForgotPassword defaultEmail={valueEmail} onHiddenCart={() => setIsModalForgot(false)}/>}
        <div className={signClass}>
            <form className={classes.registerForm} onSubmit={registerHandler}>
                <HeaderImg className={classes.headerImg} left={0} top={0} position={'absolute'}/>
                <h2 className={classes.mobileTitle}>{t('sign.register')}</h2>
                <div className={classes.buttonBox}>
                    <Button active={true}>{t('sign.register')}</Button>
                    <Link to={'/sign?mode=signIn'}><Button type="noBorder">{t('sign.login')}</Button></Link>
                </div>
                <div className={classes.inputBox}>
                    <Input
                        label={t('sign.firstName')}
                        placeholder={t('sign.firstNamePlaceholder')}
                        value={valueFirstName}
                        onChange={firstNameChangeHandler}
                        onBlur={firstNameBlurHandler}
                    />
                    {showErrorMsg(arrayErrorFirstName, classes.errorMsg)}
                    <Input
                        label={t('sign.lastName')}
                        placeholder={t('sign.lastNamePlaceholder')}
                        value={valueLastName}
                        onChange={lastNameChangeHandler}
                        onBlur={lastNameBlurHandler}
                    />
                    {showErrorMsg(arrayErrorLastName, classes.errorMsg)}
                    <Input
                        label={t('sign.nickname')}
                        placeholder={t('sign.nicknamePlaceholder')}
                        value={valueNickname}
                        onChange={nicknameChangeHandler}
                        onBlur={nicknameBlurHandler}
                    />
                    {showErrorMsg(arrayErrorNickname, classes.errorMsg)}
                    <Input
                        label={t('sign.birthday')}
                        placeholder={t('sign.birthdayPlaceholder')}
                        value={valueBirthday}
                        onChange={birthdayChangeHandler}
                        onBlur={birthdayBlurHandler}
                    />
                    {showErrorMsg(arrayErrorBirthday, classes.errorMsg)}
                    <Input
                        id="email"
                        label={t('sign.email')}
                        placeholder={t('sign.emailPlaceholder')}
                        value={valueEmail}
                        onChange={emailChangeHandler}
                        onBlur={emailBlurHandler}
                    />
                    {showErrorMsg(arrayErrorEmail, classes.errorMsg)}
                    <Input
                        id="password"
                        type="password"
                        onClick={clickPasswordHandler}
                        value={vlPassword}
                        readOnly={true}
                        label={t('sign.password')}
                        placeholder={t('sign.passwordPlaceholder')}
                    />
                </div>
                <Button height={'fit-content'} disabled={!isValidRegister} typeBtn="submit">{t('sign.signUpButton')}</Button>
                <div className={classes.mobileButtonBox}>
                    <p>{t('sign.haveAccount')}</p>
                    <Link to={'/sign?mode=signIn'} >{t('sign.enter')}</Link>
                </div>
            </form>
            <form className={classes.loginForm} onSubmit={loginHandler}>
                <h2 className={classes.mobileTitle}>{t('sign.enter')}</h2>
                <div className={classes.buttonBox}>
                    <Button active={true}>{t('sign.login')}</Button>
                    <Link to={'/sign?mode=signUp'}><Button type="noBorder">{t('sign.register')}</Button></Link>
                </div>
                <div className={classes.inputBox}>
                    <Input
                        id="email"
                        label={t('sign.email')}
                        placeholder={t('sign.emailPlaceholder')}
                        value={valueEmail}
                        onChange={emailChangeHandler}
                        onBlur={emailBlurHandler}
                    />
                    {showErrorMsg(arrayErrorEmail, classes.errorMsg)}
                    <Input
                        type="password"
                        label={t('sign.password')}
                        placeholder={t('sign.passwordPlaceholder')}
                        value={valuePassword}
                        onChange={passwordChangeHandler}
                        onBlur={passwordBlurHandler}
                    />
                    {showErrorMsg(arrayErrorPassword, classes.errorMsg)}
                    <button
                        type="button"
                        className={classes.forgetPassword}
                        onClick={forgotPasswordHandler}
                    >{t('sign.forgotPassword')}</button>
                </div>
                <Button height={'fit-content'} disabled={!isLoginValid}>{t('sign.enter')}</Button>
                <div className={classes.mobileButtonBox}>
                    <p>{t('sign.noAccount')}</p>
                    <Link to={'/sign?mode=signUp'}>{t('sign.signUpButton')}</Link>
                </div>
            </form>
            <div className={classes.imgBox}>
                <img src={patternBig} alt=""></img>
            </div>
        </div>
    </div>
}

export default SignPage;
