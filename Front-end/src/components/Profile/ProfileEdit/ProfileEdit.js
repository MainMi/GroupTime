import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import classes from './ProfileEdit.module.scss';
import Input from '../../../UI/Input/Input';
import Button from '../../../UI/Button/Button';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import { updateUserProfile } from '../../../api/userFetch';
import { fetchUserInfo } from '../../../redux/actions/auth-actions';
import { showSuccessNotification, showErrorNotification } from '../../../redux/actions/notification-actions';
import buttonsImages from '../../../static/image/buttonIcons';

// GMT offsets -12..+14 as Dropdown items ('GMT+2' shown, '2' as the value).
const GMT_OPTIONS = Array.from({ length: 27 }, (_, i) => {
    const v = i - 12;
    return { title: `GMT${v >= 0 ? '+' : ''}${v}`, value: String(v) };
});

const ProfileEdit = ({ onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userInfo = useSelector((state) => state.auth.userInfo);

    const [firstName,  setFirstName]  = useState(userInfo.firstName  || '');
    const [lastName,   setLastName]   = useState(userInfo.lastName    || '');
    const [phone,      setPhone]      = useState(userInfo.phone       || '');
    const [github,     setGithub]     = useState(userInfo.contacts?.Github    || '');
    const [instagram,  setInstagram]  = useState(userInfo.contacts?.Instagram || '');
    const [telegram,   setTelegram]   = useState(userInfo.contacts?.Telegram  || '');
    const [gmt,        setGmt]        = useState(Number.isFinite(userInfo.gmt) ? userInfo.gmt : 0);
    const [isSaving,   setIsSaving]   = useState(false);
    const [saved,      setSaved]      = useState(false);

    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        setSaved(false);

        const payload = {
            firstName: firstName.trim(),
            lastName:  lastName.trim(),
            phone:     phone.trim(),
            gmt,
            contacts: {
                Github:    github.trim(),
                Instagram: instagram.trim(),
                Telegram:  telegram.trim(),
            },
        };

        try {
            const response = await updateUserProfile(payload, navigate);
            if (response?.ok) {
                dispatch(showSuccessNotification(t('profileEdit.profileUpdated')));
                // Re-fetch user info to sync Redux state
                dispatch(fetchUserInfo(navigate));
                setSaved(true);
                setTimeout(onClose, 800);
            } else {
                dispatch(showErrorNotification(
                    response?.data?.message || t('profileEdit.saveError')
                ));
            }
        } catch (err) {
            dispatch(showErrorNotification(t('profileEdit.connError')));
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, firstName, lastName, phone, gmt, github, instagram, telegram, dispatch, navigate, onClose, t]);

    return (
        <div className={classes.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={classes.panel}>
                <div className={classes.header}>
                    <h3>{t('profileEdit.title')}</h3>
                    <button className={classes.closeBtn} onClick={onClose} aria-label={t('common.close')}>
                        <img src={buttonsImages['close-pink']} alt="close" />
                    </button>
                </div>

                <div className={classes.section}>
                    <p className={classes.sectionTitle}>{t('profileEdit.mainInfo')}</p>
                    <div className={classes.row}>
                        <label htmlFor="pe-firstName">{t('profileEdit.firstName')}</label>
                        <Input
                            id="pe-firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder={t('profileEdit.firstNamePlaceholder')}
                        />
                    </div>
                    <div className={classes.row}>
                        <label htmlFor="pe-lastName">{t('profileEdit.lastName')}</label>
                        <Input
                            id="pe-lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder={t('profileEdit.lastNamePlaceholder')}
                        />
                    </div>
                    <div className={classes.row}>
                        <label htmlFor="pe-phone">{t('profileEdit.phone')}</label>
                        <Input
                            id="pe-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+380..."
                        />
                    </div>
                    <div className={classes.row}>
                        <label htmlFor="pe-gmt">{t('profileEdit.gmt')}</label>
                        <Dropdown
                            id="pe-gmt"
                            arrValue={GMT_OPTIONS}
                            defaultIndex={gmt + 12}
                            changeValueHandler={(val) => {
                                const parsed = parseInt(val, 10);
                                setGmt(Number.isNaN(parsed) ? 0 : parsed);
                            }}
                        />
                    </div>
                </div>

                <div className={classes.section}>
                    <p className={classes.sectionTitle}>{t('profileEdit.contacts')}</p>
                    <div className={classes.row}>
                        <label htmlFor="pe-github">GitHub</label>
                        <Input
                            id="pe-github"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                            placeholder="https://github.com/..."
                        />
                    </div>
                    <div className={classes.row}>
                        <label htmlFor="pe-instagram">Instagram</label>
                        <Input
                            id="pe-instagram"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            placeholder="@username"
                        />
                    </div>
                    <div className={classes.row}>
                        <label htmlFor="pe-telegram">Telegram</label>
                        <Input
                            id="pe-telegram"
                            value={telegram}
                            onChange={(e) => setTelegram(e.target.value)}
                            placeholder="@username"
                        />
                    </div>
                </div>

                {saved && <div className={classes.success}>{t('profileEdit.saved')}</div>}

                <div className={classes.actions}>
                    <Button typeColor="noBorder" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button typeColor="green" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? t('profileEdit.saving') : t('common.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEdit;
