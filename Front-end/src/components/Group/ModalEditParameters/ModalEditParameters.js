import { useState } from "react";
import roleEnum from "../../../constants/roleEnum";
import Checkbox from "../../../UI/Checkbox/Checkbox";
import Dropdown from "../../../UI/Dropdown/Dropdown";
import HeaderImg from "../../../UI/HeaderImg/HeaderImg";
import Input from "../../../UI/Input/Input";
import Modal from "../../../UI/Modal/Modal"
import classes from './ModalEditParameters.module.scss'
import useInput from "../../../hooks/useInput";
import validateFn from "../../../constants/validateFn.enum";
import groupEmun from "../../../constants/groupEnum";
import { showErrorMsg } from "../../../error/error.validate.msg";
import Button from "../../../UI/Button/Button";
import { useTranslation } from "react-i18next";

const ModalEditParameters = ({ modalClose, parameters, parametersHandler }) => {
    const { t } = useTranslation();
    const {
        usersLimit,
        createEventInfosRole,
        viewSchedule = roleEnum.STUDENT_ROLE,
        notifacionFromEmail
    } = parameters;

    let {
        value: valueUsersLimit,
        isValidInput: isValidUsersLimit,
        arrayError: arrayErrorUsersLimit,
        valueChangeHandler: usersLimitChangeHandler,
        inputBlurHandler: usersLimitBlurHandler,
    } = useInput(
        (vl) => validateFn.isNumberFn(vl, ...groupEmun.usersLimit),
        'UsersLimit',
        usersLimit
    );

    const [valueCreateEvent, setValueCreateEvent] = useState(createEventInfosRole)
    const [valueViewSchedule, setViewSchedule] = useState(viewSchedule)
    const [
        valueNotifacionFromEmail,
        setNotifacionFromEmail
    ] = useState(notifacionFromEmail)
    
    const changeCreateEventHandler = (value) => setValueCreateEvent(value);
    const changeViewScheduleHandler = (value) => setViewSchedule(value);
    const changeNotifacionFromEmailHandler = () => setNotifacionFromEmail((prevState) => !prevState);

    const checkIsRoleFn = (value) => Object.values(roleEnum).indexOf(value)

    const submitHandler = (ev) => {
        ev.preventDefault()
        if (!isValidUsersLimit) {
            return;
        }
        parametersHandler({
            usersLimit: valueUsersLimit,
            createEventInfosRole: valueCreateEvent,
            viewSchedule: valueViewSchedule,
            notifacionFromEmail: valueNotifacionFromEmail
        })
        modalClose(false)
    }

    return <Modal onHiddenCart={modalClose} >
        <div className={classes.modal}>
            <HeaderImg className={classes.pattern}/>
            <form className={classes.content} onSubmit={submitHandler}>
                <h2>{t('groupParams.title')}</h2>
                <div className={classes.sectionBox}>
                    <label htmlFor='teacher'>{t('groupParams.usersLimit')}</label>
                    <Input
                        placeholder={t('groupParams.usersLimitPlaceholder')}
                        id="userCount"
                        type="number"
                        min={groupEmun.usersLimit[0]}
                        max={groupEmun.usersLimit[1]}
                        value={valueUsersLimit}
                        onChange={usersLimitChangeHandler}
                        onBlur={usersLimitBlurHandler}
                    />
                    {showErrorMsg(arrayErrorUsersLimit, classes.errorMsg)}

                    <label htmlFor='type'>{t('groupParams.viewSchedule')}</label>
                    <Dropdown
                        classNameButton={classes.dropdown}
                        color="pink"
                        borderRadius={15}
                        defaultIndex={checkIsRoleFn(viewSchedule)}
                        label={t('groupParams.select')}
                        arrValue={Object.values(roleEnum)}
                        changeValueHandler={changeCreateEventHandler}
                    />
                    <label htmlFor='type'>{t('groupParams.createDeleteEvents')}</label>
                    <Dropdown
                        classNameButton={classes.dropdown}
                        color="pink"
                        borderRadius={15}
                        defaultIndex={checkIsRoleFn(createEventInfosRole)}
                        label={t('groupParams.select')}
                        arrValue={Object.values(roleEnum)}
                        changeValueHandler={changeViewScheduleHandler}
                    />
                    <label htmlFor='notifacionFromEmail'>{t('groupParams.emailNotif')}</label>
                    <Checkbox
                        value={valueNotifacionFromEmail}
                        typeColor='green'
                        onChange={changeNotifacionFromEmailHandler}
                    />
                </div>
                <div className={classes.buttonBox}>
                    <Button typeColor="red" onClick={() => modalClose()}>{t('common.close')}</Button>
                    <Button typeColor="green" type="submit">{t('common.save')}</Button>
                </div>
            </form>
        </div>
    </Modal>
}

export default ModalEditParameters;