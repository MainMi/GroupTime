import { useState } from 'react';
import AvatarImg from '../../../UI/AvatarImg/AvatarImg';
import Button from '../../../UI/Button/Button';
import HeaderImg from '../../../UI/HeaderImg/HeaderImg';
import Input from '../../../UI/Input/Input';
import Textarea from '../../../UI/Textarea/Textarea';
import UserCard from '../../../UI/UserCard/UserCard';
import buttonsImages from '../../../static/image/buttonIcons';
import classes from './GroupCreate.module.scss';
import { useNavigate } from 'react-router-dom';
import ButtonSmall from '../../../UI/Button/ButtonSmall';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import AddUserForm from '../../../components/Group/AddUserForm/AddUserForm';
import groupTypeEnum from '../../../constants/type/groupTypeEnum';
import validateFn from '../../../constants/validateFn.enum';
import useInput from '../../../hooks/useInput';
import { showErrorMsg } from '../../../error/error.validate.msg';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { createGroup, inviteUsersToGroup } from '../../../api/groupFetch';
import { fetchUserInfo } from '../../../redux/actions/auth-actions';

const GroupCreate = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [readyAddUsers, setReadyAddUsers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [privateType, setPrivateType] = useState(groupTypeEnum.PUBLIC_TYPE)
    const [editUser, setEditUser] = useState(null);
    const changePrivateTypeHandler = (value) => setPrivateType(value);
    const addEditUserHandler = (e, idx, id) => {
        e.preventDefault();
        setEditUser({ id: idx, user: readyAddUsers[idx]});
        setReadyAddUsers((prevState) => prevState.filter(({user}) => user.id !== id));
    }

    let {
        value: valueGroupName,
        isValidInput: isValidGroupName,
        arrayError: arrayErrorGroupName,
        valueChangeHandler: groupNameChangeHandler,
        inputBlurHandler: groupNameBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'GroupName');
    
    let {
        value: valueDescription,
        isValidInput: isValidDescription,
        arrayError: arrayErrorDescription,
        valueChangeHandler: descriptionChangeHandler,
        inputBlurHandler: descriptionBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'Description');

    const handleAddUser = (newUser) => {
        setReadyAddUsers([...readyAddUsers, newUser]);
    };

    const dispatch = useDispatch();

    const isValidSubmit = isValidGroupName && isValidDescription;
    const submitCreateGroupHandler = async (ev) => {
        ev.preventDefault();
        if (!isValidSubmit || isSubmitting) {
            return;
        }
        setIsSubmitting(true);
        try {
            const users = [];
            const roles = [];
            const isEmptyUsers = !readyAddUsers.length;

            const { data: createGroupData, ok: createGroupOk = false } = await createGroup({
                name: valueGroupName,
                description: valueDescription,
                type: privateType
            });

            if (!createGroupOk) {
                console.error(createGroupData);
                return;
            }
            if (!isEmptyUsers) {
                const groupId = createGroupData.id;
                for (let i = 0; i < readyAddUsers.length; i++) {
                    users.push(readyAddUsers[i].user);
                    roles.push(readyAddUsers[i].role);
                }
                const { data: inviteUsersData, ok: inviteUsersOk = false } = await inviteUsersToGroup({
                    usersId: users,
                    roles,
                    groupId
                });
                if (!inviteUsersOk) {
                    console.error(inviteUsersData);
                    return;
                }
            }
            dispatch(fetchUserInfo(navigate));
            navigate('/profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteUserHandler = (id) => setReadyAddUsers((prevState) =>
        prevState.filter(({ user }) => user.id !== id)
    );

    return (
        <div className={classes.content}>
            <HeaderImg />
            <form className={classes.container} onSubmit={submitCreateGroupHandler}>
                <div className={classes.groupInfoBox}>
                    <div className={classes.groupAvatar}>
                        <AvatarImg size="large" />
                        <Button typeColor="green" beforeImg="plus" typeBtn="button" className={classes.btn}>
                            {t('group.add')}
                        </Button>
                    </div>
                    <div className={classes.groupInfo}>
                        <h1>{t('group.create')}</h1>
                        <Input
                            label={t('group.name')}
                            placeholder={t('group.namePlaceholder')}
                            labelBoxClassName={classes.labelBox}
                            value={valueGroupName}
                            onChange={groupNameChangeHandler}
                            onBlur={groupNameBlurHandler}
                        />
                        {showErrorMsg(arrayErrorGroupName, classes.errorMsg)}
                        <div className={classes.inputBox}>
                            <label htmlFor="typeGroup">{t('group.selectType')}</label>
                            <Dropdown
                                id="typeGroup"
                                label={t('group.selectType')}
                                arrValue={Object.values(groupTypeEnum).filter((type) => type !== groupTypeEnum.PERSONAL_TYPE)}
                                defaultIndex={0}
                                changeValueHandler={changePrivateTypeHandler}
                            />
                        </div>
                        <Textarea
                            label={t('group.description')}
                            labelClassName={classes.labelBox}
                            value={valueDescription}
                            onChange={descriptionChangeHandler}
                            onBlur={descriptionBlurHandler}
                        />
                        {showErrorMsg(arrayErrorDescription, classes.errorMsg)}
                    </div>
                </div>
                <div className={classes.usersForm}>
                    <div className={classes.addUsers}>
                        <p>{t('group.addUsers')}</p>
                        <AddUserForm editUser={editUser} readyAddUsers={readyAddUsers} onAddUser={handleAddUser} navigate={navigate} />
                    </div>
                    <div className={classes.usersBox}>
                        {readyAddUsers.map((userInfo, idx) => <div key={userInfo.user.id} className={classes.userCardBox} id={userInfo.user.id}>
                            <UserCard userInfo={userInfo} id={userInfo.user.id}></UserCard>
                            <div className={classes.buttonBox}>
                                <ButtonSmall
                                    typeColor='green'
                                    borderRadius={'50%'}
                                    centerImg={buttonsImages.edit}
                                    className={classes.btn}
                                    onClick={(e) => addEditUserHandler(
                                        e,
                                        idx,
                                        userInfo.user.id
                                    )}
                                />
                                <ButtonSmall
                                    typeColor='pink'
                                    borderRadius={'50%'}
                                    centerImg={buttonsImages.trash}
                                    className={classes.btn}
                                    onClick={() => deleteUserHandler(userInfo.user.id)}
                                />

                            </div>
                        </div>)}
                    </div>
                </div>
                <Button typeColor="green" disabled={!isValidSubmit || isSubmitting}>
                    {isSubmitting ? t('group.creating') : t('group.createButton')}
                </Button>
            </form>
        </div>
    );
};

export default GroupCreate;
