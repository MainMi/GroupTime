import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classes from './ConfirmEmailPage.module.scss';
import Loader from '../../UI/Loader/Loader';
import Button from '../../UI/Button/Button';
import urlEnum from '../../constants/urlEnum';
import { getFetch } from '../../api/apiFetch';

const ConfirmEmailPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            setStatus('error');
            setMessage(t('confirmEmail.noToken'));
            return;
        }

        getFetch({
            url: urlEnum.confirmEmailUrl,
            method: 'GET',
            headers: { Authorization: token },
        }).then((result) => {
            if (result?.ok) {
                setStatus('success');
                setMessage(t('confirmEmail.success'));
                setTimeout(() => navigate('/profile'), 2500);
            } else {
                setStatus('error');
                setMessage(
                    result?.data?.message ||
                    t('confirmEmail.failed')
                );
            }
        }).catch(() => {
            setStatus('error');
            setMessage(t('confirmEmail.connError'));
        });
    }, [navigate, t]);

    if (status === 'loading') {
        return (
            <div className={classes.page}>
                <div className={classes.card}>
                    <Loader inline />
                    <h2>{t('confirmEmail.loadingTitle')}</h2>
                    <p>{t('confirmEmail.pleaseWait')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={classes.page}>
            <div className={`${classes.card} ${classes[status]}`}>
                <h2>
                    {status === 'success' ? t('confirmEmail.successTitle') : t('confirmEmail.errorTitle')}
                </h2>
                <p>{message}</p>
                {status === 'error' && (
                    <Button typeColor="green" onClick={() => navigate('/sign')}>
                        {t('confirmEmail.goToLogin')}
                    </Button>
                )}
                {status === 'success' && (
                    <p style={{ fontSize: '13px', color: '#999' }}>
                        {t('confirmEmail.autoRedirect')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ConfirmEmailPage;
