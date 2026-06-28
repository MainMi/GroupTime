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
import { sendMessage, getLastMessages, analyzeSchedule, persistMessages, sendMagic, organizeSchedule } from '../../../api/messageFetch';
import { addStaticEvent, addDynamicEvent, editEvent } from '../../../api/eventFetch';
import Modal from '../../../UI/Modal/Modal';
import useInput from '../../../hooks/useInput';
import validateFn from '../../../constants/validateFn.enum';
import messageEnum from '../../../constants/type/messageEnum';
import { showErrorNotification, showSuccessNotification, showInfoNotification } from '../../../redux/actions/notification-actions';
import { canViewSchedule, canRunAssistantCommand } from '../../../helper/roleHelper';
import { ORDERED_BACKEND_DAYS, BACKEND_DAY_TO_JSDAY, SCHEDULE_TYPE, ACTION_KIND } from '../../../constants/scheduleEnum';
import { colorForType, DEFAULT_EVENT_DURATION } from '../../../constants/type/eventEnum';
import { ASSISTANT_COMMANDS, ASSISTANT_HISTORY_LIMIT } from '../../../constants/assistantEnum';
import { shiftDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../../../helper/dateHelper';
import { getStorageJSON, setStorageJSON, getStorage, setStorage } from '../../../helper/storageHelper';
import { STORAGE_KEYS } from '../../../constants/storageKeys';
import { buildAnalysisMarkdown } from '../../../helper/analysisMarkdown';

const TIME_MODE = {
    RECENT: 'recent',
    THIS_WEEK: 'thisWeek',
    THIS_MONTH: 'thisMonth',
    TWO_WEEKS: 'twoWeeks',
    CHOOSE: 'choose',
};

// True when the input starts with a given slash command (e.g. "/magic …").
const startsWithCommand = (text, command) => new RegExp(`^\\s*${command}\\b`, 'i').test(text || '');

const Modalassistant = ({
    modalClose, userInfo, date, onScheduleMutated,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);

    // Groups the user may actually view the schedule of.
    const viewableGroups = useMemo(() => (
        (userInfo?.groups || [])
            .filter((g) => g.group && canViewSchedule(g.role))
            .map((g) => ({ id: g.group._id, name: g.group.name }))
    ), [userInfo]);

    // Scope defaults to all the user's groups, but a previous selection (groups +
    // time preset) is restored from localStorage so it survives closing the window.
    const initialGroupIds = useMemo(() => {
        const all = viewableGroups.map((g) => g.id);
        const stored = getStorageJSON(STORAGE_KEYS.ASSISTANT_GROUP_IDS);
        if (Array.isArray(stored)) {
            const valid = stored.filter((id) => all.includes(id));
            if (valid.length) return valid;
        }
        return all;
    }, [viewableGroups]);

    const [selectedGroupIds, setSelectedGroupIds] = useState(initialGroupIds);
    const [timeMode, setTimeMode] = useState(
        () => getStorage(STORAGE_KEYS.ASSISTANT_TIME_MODE, TIME_MODE.RECENT)
    );
    const baseDate = useMemo(() => (date ? new Date(date) : new Date()), [date]);
    const [rangeFrom, setRangeFrom] = useState(baseDate);
    const [rangeTo, setRangeTo] = useState(baseDate);
    const [selectedDay, setSelectedDay] = useState('');

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        setStorageJSON(STORAGE_KEYS.ASSISTANT_GROUP_IDS, selectedGroupIds);
    }, [selectedGroupIds]);
    useEffect(() => {
        setStorage(STORAGE_KEYS.ASSISTANT_TIME_MODE, timeMode);
    }, [timeMode]);

    // Dropdown option lists (Dropdown seeds checkbox state once, so `checked`
    // reflects the initial selection).
    const groupsArr = useMemo(() => viewableGroups.map((g) => ({
        title: g.name,
        value: g.id,
        checked: initialGroupIds.includes(g.id),
    })), [viewableGroups, initialGroupIds]);

    const timeOptions = useMemo(() => ([
        { title: t('assistant.timeRecent'), value: TIME_MODE.RECENT },
        { title: t('assistant.timeThisWeek'), value: TIME_MODE.THIS_WEEK },
        { title: t('assistant.timeThisMonth'), value: TIME_MODE.THIS_MONTH },
        { title: t('assistant.timeTwoWeeks'), value: TIME_MODE.TWO_WEEKS },
        { title: t('assistant.chooseTime'), value: TIME_MODE.CHOOSE },
    ]), [t]);

    const dayOptions = useMemo(() => ([
        { title: t('assistant.anyDay'), value: 'any' },
        ...ORDERED_BACKEND_DAYS.map((code) => ({
            title: t(`assistant.weekday.${code}`, code),
            value: code,
        })),
    ]), [t]);

    const {
        value: valueMessage,
        isValidInput: isValidMessage,
        valueChangeHandler: messageChangeHandler,
        setValueHandler: setMessageValue,
        inputBlurHandler: messageBlurHandler,
        resetFn: resetMessage,
    } = useInput(validateFn.isNotEmptyFn, 'Message');

    // Whether the user may run write-commands (/magic, /organizer) in any selected
    // group — drives both the command menu and the per-command guards.
    const canRunCommands = useMemo(() => (
        (userInfo?.groups || []).some((g) => (
            g.group && selectedGroupIds.includes(g.group._id) && canRunAssistantCommand(g)
        ))
    ), [userInfo, selectedGroupIds]);

    // Slash commands surfaced as an autocomplete menu while the user types "/…".
    // Write-commands are hidden when the user lacks permission in every selected group.
    const commands = useMemo(() => {
        const list = [{ cmd: ASSISTANT_COMMANDS.ANALYZE, desc: t('assistant.commandAnalyzeDesc') }];
        if (canRunCommands) {
            list.unshift(
                { cmd: ASSISTANT_COMMANDS.MAGIC, desc: t('assistant.commandMagicDesc') },
                { cmd: ASSISTANT_COMMANDS.ORGANIZER, desc: t('assistant.commandOrganizerDesc') },
            );
        }
        return list;
    }, [t, canRunCommands]);
    const commandQuery = /^\/[^\s]*$/.test(valueMessage) ? valueMessage.toLowerCase() : null;
    const matchedCommands = commandQuery
        ? commands.filter((c) => c.cmd.startsWith(commandQuery))
        : [];

    const introMessage = useMemo(() => ({
        _id: 'intro',
        type: messageEnum.ASSISTANT_MSG_TYPE,
        content: t('assistant.introMessage'),
    }), [t]);

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
        setSelectedDay(val && val !== 'any' ? val : '');
    }, []);
    const handleRangeChange = useCallback(({ from, to }) => {
        setRangeFrom(from);
        setRangeTo(to);
    }, []);

    // Resolve the active date range from the selected time preset. The day filter
    // only applies to the custom "Choose time" mode.
    const { effFrom, effTo } = useMemo(() => {
        switch (timeMode) {
            case TIME_MODE.THIS_WEEK:
                return { effFrom: startOfWeek(baseDate), effTo: endOfWeek(baseDate) };
            case TIME_MODE.THIS_MONTH:
                return { effFrom: startOfMonth(baseDate), effTo: endOfMonth(baseDate) };
            case TIME_MODE.TWO_WEEKS:
                return { effFrom: baseDate, effTo: shiftDays(baseDate, 14) };
            case TIME_MODE.CHOOSE:
                return { effFrom: rangeFrom || baseDate, effTo: rangeTo || rangeFrom || baseDate };
            default: // RECENT — previous/current/next week window
                return { effFrom: shiftDays(baseDate, -7), effTo: shiftDays(baseDate, 7) };
        }
    }, [timeMode, baseDate, rangeFrom, rangeTo]);
    const effDay = timeMode === TIME_MODE.CHOOSE ? selectedDay : '';
    // Chat is grounded in a single week: the current one by default, or the range
    // start for an explicit preset.
    const chatDate = timeMode === TIME_MODE.RECENT ? baseDate : effFrom;

    const appendMessages = (newOnes) => {
        const merged = [...messages, ...newOnes];
        setMessages(merged);
        dispatch(messagesAction.updateMessages(merged));
    };

    // Mark a single action (by index) on a message as done/cancelled, leaving the
    // message's other proposed actions untouched.
    const setActionStatus = (msgId, idx, status) => {
        const updated = messages.map((m) => {
            if (m._id !== msgId || !Array.isArray(m.actions)) return m;
            return {
                ...m,
                actions: m.actions.map((a, i) => (i === idx ? { ...a, status } : a)),
            };
        });
        setMessages(updated);
        dispatch(messagesAction.updateMessages(updated));
    };

    const buildGroundData = () => ({
        user: {
            nickname: userInfo.nickname,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
        },
        groupIds: selectedGroupIds,
        date: new Date(chatDate).toISOString(),
        selectedDay: effDay || undefined,
        lang: i18n.language,
        history: messages.slice(-ASSISTANT_HISTORY_LIMIT).map((m) => ({
            role: m.type === messageEnum.ASSISTANT_MSG_TYPE ? 'assistant' : 'user',
            content: m.content,
        })),
    });

    // Shared handling for the command endpoints (/magic, /organizer): they return
    // the same `{ messages, actions }` shape. Attaches the confirmable actions to
    // the assistant turn (live only — never persisted, so a reload won't re-offer
    // them). Returns true on success so the caller knows whether to clear the input.
    const applyCommandTurn = (response) => {
        if (!(response?.ok && Array.isArray(response.data?.messages))) {
            dispatch(showErrorNotification(response?.data?.message || t('assistant.sendError')));
            return false;
        }
        const { messages: turn, actions } = response.data;
        const withActions = turn.map((m) => (
            m.type === messageEnum.ASSISTANT_MSG_TYPE && actions?.length ? { ...m, actions } : m
        ));
        appendMessages(withActions);
        resetMessage();
        return true;
    };

    const handleMagic = async () => {
        setIsSending(true);
        try {
            const response = await sendMagic(
                { message: valueMessage, groundData: buildGroundData() },
                navigate
            );
            applyCommandTurn(response);
        } catch (error) {
            dispatch(showErrorNotification(t('assistant.connError')));
        } finally {
            setIsSending(false);
        }
    };

    // "/organizer": propose tags for the selected groups' events (per-event confirm).
    const handleOrganize = async () => {
        if (!canRunCommands) {
            dispatch(showInfoNotification(t('assistant.noCommandPermission')));
            return;
        }
        setIsSending(true);
        try {
            const response = await organizeSchedule(
                { message: valueMessage || ASSISTANT_COMMANDS.ORGANIZER, groundData: buildGroundData() },
                navigate
            );
            applyCommandTurn(response);
        } catch (error) {
            dispatch(showErrorNotification(t('assistant.connError')));
        } finally {
            setIsSending(false);
        }
    };

    const buildActionDate = (action) => {
        const ev = action.event || {};
        const time = ev.time || '00:00';
        const [h, m] = time.split(':');
        if (ev.date) {
            // Build from the date midnight then set the time, so a single-digit
            // hour (e.g. "9:00") doesn't yield an Invalid Date via ISO parsing.
            const dd = new Date(`${ev.date}T00:00:00`);
            dd.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
            return dd;
        }
        const d = new Date(baseDate);
        const dow = d.getDay() === 0 ? 7 : d.getDay();
        d.setDate(d.getDate() - dow + 1); // Monday of the scoped week
        const jsDay = BACKEND_DAY_TO_JSDAY[ev.day] ?? 1;
        const offset = jsDay === 0 ? 6 : jsDay - 1;
        d.setDate(d.getDate() + offset);
        d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
        return d;
    };

    const handleConfirmAction = async (msg, idx) => {
        const action = msg?.actions?.[idx];
        if (!action || action.status || isSending) return;
        setIsSending(true);
        try {
            const ev = action.event || {};
            const common = {
                groupId: action.groupId,
                name: ev.name,
                teacherName: ev.teacherName || '',
                type: ev.type || '',
                // Keep the event's existing colour on edits; only derive one from
                // the type when the action didn't carry a colour (i.e. on create).
                color: ev.color || colorForType(ev.type),
                place: ev.place || '',
                platform: ev.platform || '',
                link: ev.link || '',
                description: ev.description || '',
                tag: Array.isArray(ev.tag) ? ev.tag : (ev.tag ? [ev.tag] : []),
                duration: Number(ev.duration) || DEFAULT_EVENT_DURATION,
            };
            const date = buildActionDate(action).toString();

            let response;
            if (action.kind === ACTION_KIND.EDIT) {
                response = await editEvent({
                    ...common,
                    date,
                    isStatic: action.isStatic,
                    eventInfoId: action.eventInfoId,
                    eventDateId: action.eventDateId,
                }, navigate);
            } else if (action.scheduleType === SCHEDULE_TYPE.STATIC) {
                response = await addStaticEvent({ ...common, date }, navigate);
            } else {
                response = await addDynamicEvent({ ...common, date }, navigate);
            }

            if (response && response.ok !== false) {
                dispatch(showSuccessNotification(
                    action.kind === ACTION_KIND.EDIT ? t('assistant.magicUpdated') : t('assistant.magicCreated')
                ));
                setActionStatus(msg._id, idx, 'done');
                // Let the schedule view invalidate caches and decide whether to refresh.
                onScheduleMutated?.(action);
            } else {
                dispatch(showErrorNotification(
                    response?.data?.message || t('assistant.magicApplyError')
                ));
            }
        } catch (error) {
            dispatch(showErrorNotification(t('assistant.connError')));
        } finally {
            setIsSending(false);
        }
    };

    const handleCancelAction = (msg, idx) => {
        setActionStatus(msg._id, idx, 'cancelled');
        dispatch(showInfoNotification(t('assistant.magicCancelled')));
    };

    const handleSendMessage = async () => {
        if (!isValidMessage || isSending) return;
        if (!selectedGroupIds.length) {
            dispatch(showErrorNotification(t('assistant.selectGroup')));
            return;
        }

        if (startsWithCommand(valueMessage, ASSISTANT_COMMANDS.ANALYZE)) {
            resetMessage();
            handleAnalyze();
            return;
        }

        const isMagic = startsWithCommand(valueMessage, ASSISTANT_COMMANDS.MAGIC);
        const isOrganizer = startsWithCommand(valueMessage, ASSISTANT_COMMANDS.ORGANIZER);
        if (isMagic || isOrganizer) {
            if (!canRunCommands) {
                dispatch(showInfoNotification(t('assistant.noCommandPermission')));
                return;
            }
            if (isOrganizer) handleOrganize();
            else handleMagic();
            return;
        }

        setIsSending(true);

        const groundData = buildGroundData();

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
                lang: i18n.language,
            }, navigate);

            if (response?.ok && response.data) {
                const content = buildAnalysisMarkdown(
                    response.data.issues || [],
                    response.data.reply || '',
                    t
                );

                // Persist the (client-built, localized) markdown so it survives a reload.
                let persisted = null;
                try {
                    const saveRes = await persistMessages(
                        [{ type: messageEnum.ASSISTANT_MSG_TYPE, content }],
                        navigate
                    );
                    if (saveRes?.ok && Array.isArray(saveRes.data) && saveRes.data.length) {
                        persisted = saveRes.data;
                    }
                } catch (persistErr) {
                    // Non-critical: fall back to a client-only analysis message below.
                }

                // Suggested fixes (e.g. resolve an overlap) come back as confirmable
                // edit actions — attach them to the analysis message (live only).
                const analysisActions = response.data.actions || [];
                const base = persisted
                    || [{ _id: `analysis-${nanoid()}`, type: messageEnum.ASSISTANT_MSG_TYPE, content }];
                appendMessages(base.map((m) => (
                    m.type === messageEnum.ASSISTANT_MSG_TYPE && analysisActions.length
                        ? { ...m, actions: analysisActions }
                        : m
                )));
            } else {
                dispatch(showErrorNotification(
                    response?.data?.message || t('assistant.sendError')
                ));
            }
        } catch (error) {
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

                <MessageList
                    messages={messages.length ? messages : [introMessage]}
                    userAvatar={userInfo?.avatar?.location}
                    onConfirmAction={handleConfirmAction}
                    onCancelAction={handleCancelAction}
                />

                <div className={classes.scopePanel}>
                    <div className={classes.scopeInline}>
                        <span className={classes.scopeLabel}>{t('assistant.groups')}:</span>
                        <Dropdown
                            type="checkbox"
                            label={t('assistant.groupsPlaceholder')}
                            arrValue={groupsArr}
                            changeValueHandler={handleGroupsChange}
                        />
                    </div>
                    <div className={classes.scopeInline}>
                        <span className={classes.scopeLabel}>{t('assistant.timeLabel')}:</span>
                        <Dropdown
                            label={t('assistant.timeRecent')}
                            defaultIndex={Math.max(0, timeOptions.findIndex((o) => o.value === timeMode))}
                            arrValue={timeOptions}
                            changeValueHandler={handleTimeChange}
                        />
                    </div>

                    {timeMode === TIME_MODE.CHOOSE && (
                        <>
                            <div className={classes.scopeInline}>
                                <span className={classes.scopeLabel}>{t('assistant.chooseTime')}:</span>
                                <RangeDatePicker
                                    placeholder={t('assistant.rangePlaceholder')}
                                    from={rangeFrom}
                                    to={rangeTo}
                                    onChange={handleRangeChange}
                                />
                            </div>
                            <div className={classes.scopeInline}>
                                <span className={classes.scopeLabel}>{t('assistant.day')}:</span>
                                <Dropdown
                                    label={t('assistant.anyDay')}
                                    defaultIndex={0}
                                    arrValue={dayOptions}
                                    changeValueHandler={handleDayChange}
                                />
                            </div>
                        </>
                    )}
                </div>

                {matchedCommands.length > 0 && (
                    <div className={classes.commandMenu}>
                        {matchedCommands.map((c) => (
                            <button
                                type="button"
                                key={c.cmd}
                                className={classes.commandItem}
                                onClick={() => setMessageValue(`${c.cmd} `)}
                            >
                                <span className={classes.commandName}>{c.cmd}</span>
                                <span className={classes.commandDesc}>{c.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

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
                        disabled={!isValidMessage || isSending || isAnalyzing}
                    >
                        {isSending || isAnalyzing ? t('assistant.wait') : t('assistant.send')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default Modalassistant;
