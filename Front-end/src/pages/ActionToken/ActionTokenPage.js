import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classes from './ActionTokenPage.module.scss';
import Loader from '../../UI/Loader/Loader';
import Button from '../../UI/Button/Button';
import Input from '../../UI/Input/Input';
import Checkbox from '../../UI/Checkbox/Checkbox';
import regex from '../../constants/regex.enum';
import {
    confirmEmailToken,
    confirmGroupInvite,
    declineGroupInvite,
    confirmGroupAdmin,
    declineGroupAdmin,
    confirmGroupUser,
    declineGroupUser,
    resetPassword,
} from '../../api/actionFetch';

// Configuration per action token flow. `auto` flows fire the request as soon as
// the page loads; non-auto flows (password change) render a form first.
// `home: true` -> on success show a "go to main page" button (no auto-redirect),
// the button only appears once the backend has responded.
// `redirectTo` -> auto-redirect after success (used only for password reset).
// Each flow keeps i18n key paths (resolved with t() at render) plus behaviour flags.
const ACTIONS = {
    confirmEmail: { auto: true, home: true, key: 'confirmEmail', run: (token) => confirmEmailToken(token) },
    confirmGroup: { auto: true, home: true, key: 'confirmGroup', run: (token) => confirmGroupInvite(token) },
    declineGroup: { auto: true, home: true, key: 'declineGroup', run: (token) => declineGroupInvite(token) },
    confirmAdmin: { auto: true, home: true, key: 'confirmAdmin', run: (token) => confirmGroupAdmin(token) },
    declineAdmin: { auto: true, home: true, key: 'declineAdmin', run: (token) => declineGroupAdmin(token) },
    confirmUser: { auto: true, home: true, key: 'confirmUser', run: (token) => confirmGroupUser(token) },
    declineUser: { auto: true, home: true, key: 'declineUser', run: (token) => declineGroupUser(token) },
    resetPassword: {
        auto: false,
        key: 'resetPassword',
        run: (token, password) => resetPassword(token, password),
        redirectTo: '/sign?mode=signIn',
    },
};

const PasswordForm = ({ onSubmit, disabled }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const test = (pattern) => new RegExp(pattern).test(password);

    const rules = [
        { ok: test(regex.REGEX_LENGTH_CHAR), label: t('actionToken.rules.min8') },
        { ok: test(regex.REGEX_LOWER_CHAR), label: t('actionToken.rules.lower') },
        { ok: test(regex.REGEX_UPPER_CHAR), label: t('actionToken.rules.upper') },
        { ok: test(regex.REGEX_NUMBER_CHAR), label: t('actionToken.rules.digit') },
        { ok: test(regex.REGEX_SPECIAL_CHAR), label: t('actionToken.rules.special') },
    ];
    const isValid = rules.every((r) => r.ok);

    return (
        <form
            className={classes.form}
            onSubmit={(ev) => { ev.preventDefault(); if (isValid && !disabled) onSubmit(password); }}
        >
            <Input
                label={t('actionToken.newPassword')}
                type="password"
                placeholder={t('actionToken.newPasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <div className={classes.rules}>
                {rules.map((r) => (
                    <Checkbox key={r.label} checked={r.ok} readOnly={true}>{r.label}</Checkbox>
                ))}
            </div>
            <Button typeColor="green" typeBtn="submit" disabled={!isValid || disabled}>
                {disabled ? t('actionToken.wait') : t('actionToken.changePassword')}
            </Button>
        </form>
    );
};

const ActionTokenPage = ({ action }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const config = ACTIONS[action];
    // Resolve a flow's i18n field (title/loadingText/successTitle/successText/errorTitle).
    const flow = (field) => (config ? t(`actionToken.flows.${config.key}.${field}`) : '');

    const token = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('token');
    }, []);

    // form  -> waiting for user input (password flows)
    // loading -> request in flight
    // success / error -> terminal states
    const [status, setStatus] = useState(() => {
        if (!config) return 'error';
        if (!token) return 'error';
        return config.auto ? 'loading' : 'form';
    });
    const [message, setMessage] = useState(() => {
        if (!config) return t('actionToken.unknownAction');
        if (!token) return t('actionToken.noToken');
        return '';
    });

    const ranRef = useRef(false);

    const execute = useCallback(async (password) => {
        if (!config || !token) return;
        setStatus('loading');
        try {
            const result = await config.run(token, password);
            if (result?.ok) {
                setStatus('success');
                setMessage(flow('successText'));
                if (config.redirectTo) {
                    setTimeout(() => navigate(config.redirectTo), 2500);
                }
            } else {
                setStatus('error');
                setMessage(result?.data?.message || t('actionToken.linkExpired'));
            }
        } catch (e) {
            setStatus('error');
            setMessage(t('actionToken.connError'));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, token, navigate]);

    // Auto-fire for non-form flows once
    useEffect(() => {
        if (config?.auto && token && !ranRef.current) {
            ranRef.current = true;
            execute();
        }
    }, [config, token, execute]);

    const title = config ? flow('title') : t('actionToken.defaultTitle');

    return (
        <div className={classes.page}>
            <div className={`${classes.card} ${classes[status] || ''}`}>
                {status === 'loading' && (
                    <>
                        <Loader inline />
                        <h2>{title}</h2>
                        <p>{flow('loadingText') || t('actionToken.pleaseWait')}</p>
                    </>
                )}

                {status === 'form' && (
                    <>
                        <h2>{title}</h2>
                        <PasswordForm onSubmit={execute} disabled={false} />
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2>{flow('successTitle') || t('actionToken.doneTitle')}</h2>
                        <p>{message}</p>
                        {config?.home && (
                            <Button typeColor="green" onClick={() => navigate('/')}>
                                {t('actionToken.goHome')}
                            </Button>
                        )}
                        {config?.redirectTo && (
                            <p className={classes.hint}>{t('actionToken.autoRedirect')}</p>
                        )}
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2>{flow('errorTitle') || t('actionToken.errorTitle')}</h2>
                        <p>{message}</p>
                        <Button typeColor="green" onClick={() => navigate('/sign')}>
                            {t('actionToken.goToLogin')}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActionTokenPage;
