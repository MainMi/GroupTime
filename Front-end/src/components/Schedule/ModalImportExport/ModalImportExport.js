import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import classes from './ModalImportExport.module.scss';
import Modal from '../../../UI/Modal/Modal';
import Button from '../../../UI/Button/Button';
import { importEvents } from '../../../api/eventFetch';
import { getCalendarSubscribeUrl, regenerateCalendarSubscribeUrl } from '../../../api/scheduleFetch';
import { showSuccessNotification, showErrorNotification } from '../../../redux/actions/notification-actions';

// One place to sync a group's schedule with external calendars: import a .ics
// file, or get a subscription link Google/Outlook/Apple can follow. `canImport`
// gates the import half to schedule editors; export is available to any member.
const ModalImportExport = ({ modalClose, groupId, canImport, refreshSchedule }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const importInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    const [calUrl, setCalUrl] = useState('');
    const [publicUrl, setPublicUrl] = useState('');
    const [calLoading, setCalLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedPublic, setCopiedPublic] = useState(false);

    // The .ics feed and the read-only web view share the group's one share token.
    const webLinkFromToken = (tokenValue) => (tokenValue
        ? `${window.location.origin}/schedule/public/${tokenValue}`
        : '');

    const handleImportFile = useCallback(async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setIsImporting(true);
        try {
            const ics = await file.text();
            const res = await importEvents({ groupId, ics }, navigate);
            if (res && res.ok !== false) {
                dispatch(showSuccessNotification(t('schedule.imported', { count: res.data?.imported ?? 0 })));
                if (refreshSchedule) refreshSchedule();
            } else {
                dispatch(showErrorNotification(t('schedule.importError')));
            }
        } catch (err) {
            dispatch(showErrorNotification(t('schedule.importError')));
        } finally {
            setIsImporting(false);
        }
    }, [groupId, navigate, dispatch, t, refreshSchedule]);

    const handleGetCalUrl = useCallback(async () => {
        if (calLoading) return;
        setCalLoading(true);
        try {
            const res = await getCalendarSubscribeUrl({ groupId }, navigate);
            if (res?.data?.url) {
                setCalUrl(res.data.url);
                setPublicUrl(webLinkFromToken(res.data.token));
            } else dispatch(showErrorNotification(t('scheduleSettings.calendarError')));
        } catch (err) {
            dispatch(showErrorNotification(t('scheduleSettings.calendarError')));
        } finally {
            setCalLoading(false);
        }
    }, [calLoading, groupId, navigate, dispatch, t]);

    const handleCopyCalUrl = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(calUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            dispatch(showErrorNotification(t('scheduleSettings.copyError')));
        }
    }, [calUrl, dispatch, t]);

    const handleCopyPublicUrl = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopiedPublic(true);
            setTimeout(() => setCopiedPublic(false), 1500);
        } catch (err) {
            dispatch(showErrorNotification(t('scheduleSettings.copyError')));
        }
    }, [publicUrl, dispatch, t]);

    const handleRegenerateCal = useCallback(async () => {
        if (calLoading) return;
        setCalLoading(true);
        try {
            const res = await regenerateCalendarSubscribeUrl({ groupId }, navigate);
            if (res?.data?.url) {
                setCalUrl(res.data.url);
                setPublicUrl(webLinkFromToken(res.data.token));
                dispatch(showSuccessNotification(t('scheduleSettings.calendarRegenerated')));
            } else {
                dispatch(showErrorNotification(t('scheduleSettings.calendarError')));
            }
        } catch (err) {
            dispatch(showErrorNotification(t('scheduleSettings.calendarError')));
        } finally {
            setCalLoading(false);
        }
    }, [calLoading, groupId, navigate, dispatch, t]);

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.content}>
                <h3 className={classes.title}>{t('schedule.importExport')}</h3>

                {canImport && (
                    <section className={classes.section}>
                        <h4 className={classes.sectionTitle}>{t('schedule.importTitle')}</h4>
                        <p className={classes.note}>{t('schedule.importHint')}</p>
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".ics,text/calendar"
                            style={{ display: 'none' }}
                            onChange={handleImportFile}
                        />
                        <Button
                            typeColor="green"
                            onClick={() => importInputRef.current?.click()}
                            disabled={isImporting}
                        >
                            {isImporting ? t('schedule.importing') : t('schedule.importChoose')}
                        </Button>
                    </section>
                )}

                <section className={classes.section}>
                    <h4 className={classes.sectionTitle}>{t('scheduleSettings.calendarExport')}</h4>
                    <p className={classes.note}>{t('scheduleSettings.calendarHint')}</p>
                    {!calUrl ? (
                        <Button typeColor="green" onClick={handleGetCalUrl} disabled={calLoading}>
                            {calLoading ? t('scheduleSettings.saving') : t('scheduleSettings.getCalendarLink')}
                        </Button>
                    ) : (
                        <>
                            <div className={classes.calRow}>
                                <input
                                    className={classes.calInput}
                                    type="text"
                                    readOnly
                                    value={calUrl}
                                    onFocus={(e) => e.target.select()}
                                />
                                <Button typeColor="green" onClick={handleCopyCalUrl}>
                                    {copied ? t('scheduleSettings.copied') : t('scheduleSettings.copy')}
                                </Button>
                            </div>
                            <div className={classes.calActions}>
                                <a className={classes.calLink} href={calUrl} target="_blank" rel="noreferrer">
                                    {t('scheduleSettings.downloadIcs')}
                                </a>
                                <button
                                    type="button"
                                    className={classes.calLinkBtn}
                                    onClick={handleRegenerateCal}
                                    disabled={calLoading}
                                >
                                    {t('scheduleSettings.regenerateLink')}
                                </button>
                            </div>
                        </>
                    )}
                </section>

                {publicUrl && (
                    <section className={classes.section}>
                        <h4 className={classes.sectionTitle}>{t('scheduleSettings.publicLink')}</h4>
                        <p className={classes.note}>{t('scheduleSettings.publicHint')}</p>
                        <div className={classes.calRow}>
                            <input
                                className={classes.calInput}
                                type="text"
                                readOnly
                                value={publicUrl}
                                onFocus={(e) => e.target.select()}
                            />
                            <Button typeColor="green" onClick={handleCopyPublicUrl}>
                                {copiedPublic ? t('scheduleSettings.copied') : t('scheduleSettings.copy')}
                            </Button>
                        </div>
                        <a className={classes.calLink} href={publicUrl} target="_blank" rel="noreferrer">
                            {t('scheduleSettings.openPublic')}
                        </a>
                    </section>
                )}

                <div className={classes.buttonGroup}>
                    <Button type="button" typeColor="noBorder" onClick={modalClose}>
                        {t('common.close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalImportExport;
