import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';

import { messagesAction } from '../../../redux/slices/message-slice';
import MessageList from '../MessageList/MessageList';
import classes from './ModalAssitent.module.scss';
import buttonsImages from '../../../static/image/buttonIcons';
import Input from '../../../UI/Input/Input';
import Button from '../../../UI/Button/Button';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import RangeDatePicker from '../../../UI/RangeDatePicker/RangeDatePicker';
import { sendMessage, getLastMessages, analyzeSchedule } from '../../../api/messageFetch';
import Modal from '../../../UI/Modal/Modal';
import useInput from '../../../hooks/useInput';
import validateFn from '../../../constants/validateFn.enum';
import messageEnum from '../../../constants/type/messageEnum';
import { showErrorNotification } from '../../../redux/actions/notification-actions';
import roleEnum, { ROLE_ORDER } from '../../../constants/roleEnum';
import { ORDERED_BACKEND_DAYS } from '../../../constants/scheduleEnum';
import { buildAnalysisMarkdown } from '../../../helper/analysisMarkdown';

// Viewing a group's schedule requires STUDENT or above.
const canViewSchedule = (role) =>
    ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(roleEnum.STUDENT_ROLE);

// Time-scope modes for the "Time" dropdown.
const TIME_MODE = { ANY: 'any', CHOOSE: 'choose' };

const Modalassistant = ({ modalClose, groupInfo, userInfo, date }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);

    // Groups the user may actually view the schedule of.
    const viewableGroups = useMemo(() => (
        (userInfo?.groups || [])
            .filter((g) => g.group && canViewSchedule(g.role))
            .map((g) => ({ id: g.group._id, name: g.group.name }))
    ), [userInfo]);

    // --- Scope controls (which groups / time range / which day) ---
    const initialGroupIds = useMemo(() => (
        groupInfo?._id ? [groupInfo._id] : viewableGroups.map((g) => g.id)
    ), [groupInfo, viewableGroups]);

    const [selectedGroupIds, setSelectedGroupIds] = useState(initialGroupIds);
    const [timeMode, setTimeMode] = useState(TIME_MODE.ANY);
    const baseDate = useMemo(() => (date ? new Date(date) : new Date()), [date]);
    const [rangeFrom, setRangeFrom] = useState(baseDate);
    const [rangeTo, setRangeTo] = useState(baseDate);
    const [selectedDay, setSelectedDay] = useState('');

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Dropdown option lists (Dropdown seeds checkbox state once, so `checked`
    // reflects the initial selection).
    const groupsArr = useMemo(() => viewableGroups.map((g) => ({
        title: g.name,
        value: g.id,
        checked: initialGroupIds.includes(g.id),
    })), [viewableGroups, initialGroupIds]);

    const timeOptions = useMemo(() => ([
        { title: t('assistant.anyTime'), value: TIME_MODE.ANY },
        { title: t('assistant.chooseTime'), value: TIME_MODE.CHOOSE },
    ]), [t]);

    const dayOptions = useMemo(() => ([
        { title: t('assistant.anyDay'), value: TIME_MODE.ANY },
        ...ORDERED_BACKEND_DAYS.map((code) => ({
            title: t(`assistant.weekday.${code}`, code),
            value: code,
        })),
    ]), [t]);

    const {
        value: valueMessage,
        isValidInput: isValidMessage,
        valueChangeHandler: messageChangeHandler,
        inputBlurHandler: messageBlurHandler,
        resetFn: resetMessage,
    } = useInput(validateFn.isNotEmptyFn, 'Message');

    const messageHistory = useSelector((state) => state.messages.history);

    useEffect(() => {
        if (messageHistory?.length) {
            setMessages(messageHistory);
        } else {
            dispatch(getLastMessages(navigate));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (messageHistory?.length && !messages.length) {
            setMessages(messageHistory);
        }
    }, [messageHistory]); // eslint-disable-line react-hooks/exhaustive-deps

    // Stable handlers — Dropdown re-fires its change effect whenever the handler
    // identity changes, so these must be memoised.
    const handleGroupsChange = useCallback((vals) => {
        if (Array.isArray(vals)) setSelectedGroupIds(vals);
    }, []);
    const handleTimeChange = useCallback((val) => {
        if (val) setTimeMode(val);
    }, []);
    const handleDayChange = useCallback((val) => {
        setSelectedDay(val && val !== TIME_MODE.ANY ? val : '');
    }, []);
    const handleRangeChange = useCallback(({ from, to }) => {
        setRangeFrom(from);
        setRangeTo(to);
    }, []);

    // Resolve the scope actually sent to the backend. "Any time" falls back to the
    // current week (baseDate); the analyze endpoint requires date/dateFrom. The day
    // filter only applies in "Choose time" mode, so a day picked there can't leak
    // into an "Any time" request after the user switches back.
    const effFrom = timeMode === TIME_MODE.CHOOSE && rangeFrom ? rangeFrom : baseDate;
    const effTo = timeMode === TIME_MODE.CHOOSE && rangeTo ? rangeTo : effFrom;
    const effDay = timeMode === TIME_MODE.CHOOSE ? selectedDay : '';

    const appendMessages = (newOnes) => {
        const merged = [...messages, ...newOnes];
        setMessages(merged);
        dispatch(messagesAction.updateMessages(merged));
    };

    const handleSendMessage = async () => {
        if (!isValidMessage || isSending) return;
        if (!selectedGroupIds.length) {
            dispatch(showErrorNotification(t('assistant.selectGroup')));
            return;
        }
        setIsSending(true);

        const groundData = {
            user: {
                nickname: userInfo.nickname,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
            },
            groupIds: selectedGroupIds,
            date: new Date(effFrom).toISOString(),
            selectedDay: effDay || undefined,
        };

        try {
            const response = await sendMessage(
                { message: valueMessage, groundData },
                navigate
            );

            if (response?.ok && Array.isArray(response.data)) {
                appendMessages(response.data);
                resetMessage();
            } else {
                dispatch(showErrorNotification(
                    response?.data?.message || t('assistant.sendError')
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            dispatch(showErrorNotification(t('assistant.connError')));
        } finally {
            setIsSending(false);
        }
    };

    const handleAnalyze = async () => {
        if (isAnalyzing) return;
        if (!selectedGroupIds.length) {
            dispatch(showErrorNotification(t('assistant.selectGroup')));
            return;
        }
        setIsAnalyzing(true);

        try {
            const response = await analyzeSchedule({
                groupIds: selectedGroupIds,
                dateFrom: new Date(effFrom).toISOString(),
                dateTo: new Date(effTo).toISOString(),
                selectedDay: effDay || undefined,
            }, navigate);

            if (response?.ok && response.data) {
                // Show the analysis as a normal (markdown) assistant message in chat.
                const content = buildAnalysisMarkdown(
                    response.data.issues || [],
                    response.data.reply || '',
                    t
                );
                appendMessages([{ _id: `analysis-${nanoid()}`, type: messageEnum.ASSISTANT_MSG_TYPE, content }]);
            } else {
                dispatch(showErrorNotification(
                    response?.data?.message || t('assistant.sendError')
                ));
            }
        } catch (error) {
            console.error('Error analyzing schedule:', error);
            dispatch(showErrorNotification(t('assistant.connError')));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Modal onHiddenCart={modalClose}>
            <div className={classes.modalContent} data-tour="assistant-modal">
                <div className={classes.titleBox}>
                    <h4>{t('assistant.title')}</h4>
                    <img
                        src={buttonsImages['close-pink']}
                        alt="close"
                        onClick={modalClose}
                        style={{ cursor: 'pointer' }}
                    />
                </div>

                {!!messages?.length && <MessageList messages={messages} />}

                {/* Scope controls sit directly above the send row */}
                <div className={classes.scopePanel}>
                    <div className={classes.scopeRow}>
                        <div className={classes.scopeField}>
                            <label>{t('assistant.groups')}</label>
                            <Dropdown
                                type="checkbox"
                                label={t('assistant.groupsPlaceholder')}
                                arrValue={groupsArr}
                                changeValueHandler={handleGroupsChange}
                            />
                        </div>
                        <div className={classes.scopeField}>
                            <label>{t('assistant.timeLabel')}</label>
                            <Dropdown
                                label={t('assistant.anyTime')}
                                defaultIndex={0}
                                arrValue={timeOptions}
                                changeValueHandler={handleTimeChange}
                            />
                        </div>
                        <Button
                            typeColor="green"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? t('assistant.detecting') : t('assistant.detect')}
                        </Button>
                    </div>

                    {timeMode === TIME_MODE.CHOOSE && (
                        <div className={classes.scopeRow}>
                            <div className={classes.scopeField}>
                                <label>{`${t('assistant.dateFrom')} – ${t('assistant.dateTo')}`}</label>
                                <RangeDatePicker
                                    placeholder={t('assistant.rangePlaceholder')}
                                    from={rangeFrom}
                                    to={rangeTo}
                                    onChange={handleRangeChange}
                                />
                            </div>
                            <div className={classes.scopeField}>
                                <label>{t('assistant.day')}</label>
                                <Dropdown
                                    label={t('assistant.anyDay')}
                                    defaultIndex={0}
                                    arrValue={dayOptions}
                                    changeValueHandler={handleDayChange}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className={classes.buttonBox}>
                    <Input
                        value={valueMessage}
                        onChange={messageChangeHandler}
                        onBlur={messageBlurHandler}
                        onKeyDown={handleKeyDown}
                        placeholder={t('assistant.placeholder')}
                    />
                    <Button
                        typeColor="green"
                        onClick={handleSendMessage}
                        disabled={!isValidMessage || isSending}
                    >
                        {isSending ? t('assistant.wait') : t('assistant.send')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default Modalassistant;
