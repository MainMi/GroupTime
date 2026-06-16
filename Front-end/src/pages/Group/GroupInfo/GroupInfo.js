import { useNavigate, useParams } from 'react-router-dom';
import AvatarImg from '../../../UI/AvatarImg/AvatarImg';
import Button from '../../../UI/Button/Button';
import HeaderImg from '../../../UI/HeaderImg/HeaderImg';
import UserCard from '../../../UI/UserCard/UserCard';
import buttonsImages from '../../../static/image/buttonIcons';
import classes from './GroupInfo.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUserInfo } from '../../../redux/actions/auth-actions';
import { deleteGroup, editGroup, getGroupInfo, leaveGroup, searchGroup, inviteUsersToGroup, deleteInviteGroup, removeUserFromGroup, transferOwnership } from '../../../api/groupFetch';
import roleEnum from '../../../constants/roleEnum';
import Textarea from '../../../UI/Textarea/Textarea';
import useInput from '../../../hooks/useInput';
import validateFn from '../../../constants/validateFn.enum';
import { showErrorMsg } from '../../../error/error.validate.msg';
import Input from '../../../UI/Input/Input';
import ModalEditParameters from '../../../components/Group/ModalEditParameters/ModalEditParameters';
import AddUserForm from '../../../components/Group/AddUserForm/AddUserForm';
import ConfirmModal from '../../../UI/ConfirmModal/ConfirmModal';
import AvatarUploadModal from '../../../UI/AvatarUploadModal/AvatarUploadModal';
import AvatarEditable from '../../../UI/AvatarEditable/AvatarEditable';
import { uploadGroupAvatar, selectGroupAvatar, deleteGroupAvatar } from '../../../api/fileFetch';
import { showSuccessNotification } from '../../../redux/actions/notification-actions';
import { DEFAULT_CACHE_TTL } from '../../../constants/cacheConfig';

const GroupInfo = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { groupId } = useParams();

    const userInfo = useSelector((state) => state.auth.userInfo);
    const groupsInfo = useSelector((state) => state.group.groupsInfo);

    const [isModal, setIsModal] = useState(false);
    const [groupInfo, setGroupInfo] = useState([]);
    const [role, setRole] = useState(roleEnum.STUDENT_ROLE);
    const [parameters, setParameters] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [stagedRemovals, setStagedRemovals] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);

    const fetchedForGroupRef = useRef(null);

    let { value: valueTitle, isValidInput: isValidTitle, arrayError: arrayErrorTitle, setValueHandler: setTitleHandler, valueChangeHandler: titleChangeHandler, inputBlurHandler: titleBlurHandler } = useInput(validateFn.isNotEmptyFn, 'Title');
    let { value: valueDescription, isValidInput: isValidDescription, arrayError: arrayErrorDescription, setValueHandler: setDescriptionHandler, valueChangeHandler: descriptionChangeHandler, inputBlurHandler: descriptionBlurHandler } = useInput(validateFn.isNotEmptyFn, 'Description');

    const onModalCloseHandler = (resetValue = true) => {
        setIsModal(false);
        if (resetValue) setParameters(null);
    };
    
    const onModalOpenHandler = () => setIsModal(true);
    const parametersChangeHandler = (value) => setParameters(value);

    const toggleIsEditHandler = (title, description, toggle = true) => {
        setIsEdit(toggle);
        if (!toggle) setStagedRemovals([]);
        if (valueTitle !== title) setTitleHandler(title);
        if (valueDescription !== description) setDescriptionHandler(description);
    };

    const getUserKey = (item) => item?.actionToken || item?.user?._id || item?.user;
    const isStagedForRemoval = (item) =>
        stagedRemovals.some((s) => getUserKey(s) === getUserKey(item));
    const stageRemoval = (item) => {
        setStagedRemovals((prev) =>
            prev.some((s) => getUserKey(s) === getUserKey(item))
                ? prev.filter((s) => getUserKey(s) !== getUserKey(item))
                : [...prev, item]
        );
    };

    const doSave = async () => {
        if (!isValidTitle || !isValidDescription) {
            return;
        }
        setShowConfirm(false);
        for (const item of stagedRemovals) {
            if (item.actionToken) {
                await deleteInviteGroup(item.actionToken);
            } else {
                const memberId = item?.user?._id || item?.user;
                if (memberId) await removeUserFromGroup({ groupId, userId: memberId }, navigate);
            }
        }
        const data = {
            name: valueTitle,
            description: valueDescription,
            groupId,
            ...(parameters && { parameters })
        };
        await dispatch(editGroup(data));
        dispatch(getGroupInfo(groupId, navigate));
        dispatch(fetchUserInfo(navigate));
        setStagedRemovals([]);
        setIsEdit(false);
    };

    const handleApply = (ev) => {
        if (ev) ev.preventDefault();
        if (stagedRemovals.length > 0) {
            setShowConfirm(true);
            return;
        }
        doSave();
    };
    
    useEffect(() => {
        if (!userInfo?.nickname) dispatch(fetchUserInfo(navigate));
    }, [dispatch, navigate, userInfo]);

    useEffect(() => {
        fetchedForGroupRef.current = null;
    }, [groupId]);

    useEffect(() => {
        if (!userInfo?.nickname) return;

        if (groupsInfo.length > 0) {
            const groupFromState = groupsInfo.find(({ id }) => id === groupId);
            if (groupFromState) {
                setGroupInfo({ group: groupFromState, isFullInfo: true });
                const groupFromUser = userInfo?.groups?.find(vl => vl?.group?._id === groupId);
                setRole(groupFromUser?.role || roleEnum.STUDENT_ROLE);
                // Cached copy is shown immediately; revalidate in the background only
                // if it's stale (avoids a request on every visit).
                const isStale = (Date.now() - (groupFromState.fetchedAt || 0)) > DEFAULT_CACHE_TTL;
                if (isStale && fetchedForGroupRef.current !== groupId) {
                    fetchedForGroupRef.current = groupId;
                    dispatch(getGroupInfo(groupId, navigate));
                }
                return;
            }
        }

        const groupFromUser = userInfo?.groups?.find(vl => vl?.group?._id === groupId);
        if (groupFromUser) {
            setRole(groupFromUser.role);
            setTitleHandler(groupFromUser.group.name);
            setDescriptionHandler(groupFromUser.group.description);
            if (fetchedForGroupRef.current !== groupId) {
                fetchedForGroupRef.current = groupId;
                dispatch(getGroupInfo(groupId, navigate));
            }
            return;
        }

        if (fetchedForGroupRef.current !== groupId) {
            fetchedForGroupRef.current = groupId;
            const fetchData = async () => {
                try {
                    const group = await searchGroup(groupId);
                    if (!group.data[0]?._id) {
                        navigate('/profile');
                        return;
                    }
                    setGroupInfo({ group: group.data[0], isFullInfo: false });
                } catch (error) {
                    console.error('Error fetching group:', error);
                }
            };
            fetchData();
        }
    }, [userInfo, groupsInfo, groupId, dispatch, navigate, setTitleHandler, setDescriptionHandler]);

    if (!userInfo?.nickname || !groupInfo?.group?.id) return <div>{t('common.loading')}</div>;

    const { group } = groupInfo;
    const { users } = group;
    // owner can delete the group; owner + admin ("managers") can edit/manage members.
    const isOwner = role === roleEnum.OWNER_ROLE;
    const isManager = isOwner || role === roleEnum.ADMIN_ROLE;
    const isPrivate = groupInfo?.type === 'private';

    const deleteGroupHandler = async () => {
        setShowLeaveConfirm(false);
        const response = isOwner ? await deleteGroup(groupId) : await leaveGroup(groupId);
        if (response.ok) {
            navigate('/profile');
            dispatch(fetchUserInfo(navigate));
        }
    };

    const refreshGroupAvatar = (successMsg) => {
        dispatch(showSuccessNotification(successMsg));
        dispatch(getGroupInfo(groupId, navigate));
        dispatch(fetchUserInfo(navigate));
    };
    const handleGroupAvatarUpload = async (file) => {
        const res = await uploadGroupAvatar(groupId, file);
        if (res && res.ok !== false) refreshGroupAvatar(t('groupInfo.photoUpdated'));
        return res;
    };
    const handleGroupAvatarSelect = async (fileId) => {
        const res = await selectGroupAvatar(groupId, fileId);
        if (res && res.ok !== false) refreshGroupAvatar(t('groupInfo.photoUpdated'));
        return res;
    };
    const handleGroupAvatarDelete = async (fileId) => {
        const res = await deleteGroupAvatar(groupId, fileId);
        if (res && res.ok !== false) refreshGroupAvatar(t('groupInfo.photoDeleted'));
        return res;
    };

    const handleTransferOwnership = async (userId) => {
        const res = await transferOwnership({ groupId, userId }, navigate);
        if (res && res.ok !== false) {
            dispatch(showSuccessNotification(t('groupInfo.ownershipTransferred')));
            dispatch(getGroupInfo(groupId, navigate));
            dispatch(fetchUserInfo(navigate));
        }
    };

    // Exclude current members from the invite search
    const existingMembersForForm = (users || [])
        .map((u) => ({ user: { id: u?.user?._id } }))
        .filter((x) => x.user.id);

    const handleInviteUser = async ({ user, role: inviteRole }) => {
        const res = await inviteUsersToGroup({ usersId: [user], roles: [inviteRole], groupId });
        if (res && res.ok !== false) {
            dispatch(showSuccessNotification(t('groupInfo.inviteSent')));
            dispatch(getGroupInfo(groupId, navigate));
            dispatch(fetchUserInfo(navigate));
        }
    };

    return (
        <div className={classes.content}>
            <HeaderImg />
            <div className={classes.container}>
                <Button typeColor='green' beforeImg='chevron' className={classes.btn} onClick={() => navigate(-1)}>{t('groupInfo.back')}</Button>
                <div className={classes.groupInfoBox}>
                    {isEdit && isManager ? (
                        <AvatarEditable
                            size={'large'}
                            src={group.avatar?.location || null}
                            onEdit={() => setIsAvatarOpen(true)}
                            buttonLabel={t('groupInfo.changeGroupPhoto')}
                        />
                    ) : (
                        <AvatarImg size={'large'} src={group.avatar?.location || null} />
                    )}
                    <div className={classes.groupInfo}>
                        {!isEdit 
                            ? <h1>{group.name}</h1>
                            : <div>
                                <Input value={valueTitle} onChange={titleChangeHandler} onBlur={titleBlurHandler} inputClassName={classes.inputTitle} />
                                {showErrorMsg(arrayErrorTitle, classes.errorMsg)}
                            </div>
                        }
                        <div className={classes.buttonBox}>
                            <div className={classes.groupInfoBtn}>
                                <img src={buttonsImages[isPrivate ? 'LockClose-pink' : 'lockOpen-green']} alt="lock" />
                                {group.type}
                            </div>
                            <div className={`${classes.groupInfoBtn} ${classes.green}`}>
                                <img src={buttonsImages['people-green']} alt="people" />
                                {group.userCount}/{group.parameters.usersLimit}
                            </div>
                        </div>
                        {!isEdit
                            ? <p>{t('groupInfo.descriptionLabel')}: {group.description}</p>
                            : <div>
                                <Textarea value={valueDescription} onChange={descriptionChangeHandler} onBlur={descriptionBlurHandler} inputClassName={classes.inputDescription} />
                                {showErrorMsg(arrayErrorDescription, classes.errorMsg)}
                            </div>
                        }
                        <div className={classes.buttonBox}>
                            {!isEdit
                                ? <Button onClick={() => setShowLeaveConfirm(true)}>{isOwner ? t('groupInfo.deleteGroup') : t('groupInfo.leaveGroup')}</Button>
                                : <Button onClick={() => toggleIsEditHandler(group.name, group.description, false)}>{t('common.cancel')}</Button>
                            }
                            {isManager && <>
                                {!isEdit
                                ? <Button typeColor='green' onClick={() => toggleIsEditHandler(group.name, group.description)}>{t('common.edit')}</Button>
                                : <div className={classes.buttonBox}>
                                    <Button typeColor='green' onClick={onModalOpenHandler}>{t('groupInfo.configureParams')}</Button>
                                    <Button typeColor='green' onClick={handleApply}>{t('groupInfo.apply')}</Button>
                                </div>
                            }</>}
                        </div>
                    </div>
                </div>
                <div className={classes.userBox}>
                    <p>{t('groupInfo.members')}: {group.userCount}</p>
                    {isEdit && isManager && (
                        <div className={classes.addUserBox}>
                            <p>{t('groupInfo.addUsers')}</p>
                            <AddUserForm
                                onAddUser={handleInviteUser}
                                readyAddUsers={existingMembersForForm}
                                navigate={navigate}
                                editUser={null}
                            />
                        </div>
                    )}
                    <div className={classes.users}>
                        {users?.map((userItem, idx) => {
                            const actualUser = userItem?.user || userItem;
                            if (typeof actualUser === 'string' || !actualUser?.fullName) return null;

                            return (
                                <UserCard
                                    key={actualUser._id + idx}
                                    userInfo={userItem}
                                    ifSelf={actualUser._id === (userInfo._id || userInfo.id)}
                                    isAdmin={isManager}
                                    isOwner={isOwner}
                                    isEditMode={isEdit}
                                    isStaged={isStagedForRemoval(userItem)}
                                    onStageRemoval={stageRemoval}
                                    onTransferOwnership={handleTransferOwnership}
                                    groupId={groupId}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
            {isAvatarOpen && (
                <AvatarUploadModal
                    title={t('groupInfo.changeGroupPhoto')}
                    gallery={group.avatarGallery || []}
                    currentAvatarId={group.avatar?._id || null}
                    onUpload={handleGroupAvatarUpload}
                    onSelect={handleGroupAvatarSelect}
                    onDelete={handleGroupAvatarDelete}
                    modalClose={() => setIsAvatarOpen(false)}
                />
            )}
            {isModal && <ModalEditParameters modalClose={onModalCloseHandler} parameters={group.parameters} parametersHandler={parametersChangeHandler} />}
            {showConfirm && (
                <ConfirmModal
                    title={t('groupInfo.deleteInviteTitle')}
                    message={t('groupInfo.deleteInviteMessage', { count: stagedRemovals.length })}
                    confirmText={t('groupInfo.deleteInviteConfirm')}
                    onConfirm={doSave}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            {showLeaveConfirm && (
                <ConfirmModal
                    title={isOwner ? t('groupInfo.deleteGroup') : t('groupInfo.leaveGroup')}
                    message={isOwner
                        ? t('groupInfo.deleteGroupMessage')
                        : t('groupInfo.leaveGroupMessage')}
                    confirmText={isOwner ? t('common.delete') : t('groupInfo.leave')}
                    onConfirm={deleteGroupHandler}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}
        </div>
    );
};

export default GroupInfo;