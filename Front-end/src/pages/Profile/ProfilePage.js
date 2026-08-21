import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchUserInfo } from '../../redux/actions/auth-actions';
import { authAction } from '../../redux/slices/auth-slice';

import Button from '../../UI/Button/Button';
import Loader from '../../UI/Loader/Loader';
import GroupCard from '../../UI/GroupCard/GroupCard';
import HeaderImg from '../../UI/HeaderImg/HeaderImg';
import contactImages from '../../static/image/contactsIcons';
import classes from './ProfilePage.module.scss';
import NotFoundGroups from '../../components/Group/NotFoundGroups/NotFoundGroups';
import AvatarEditable from '../../UI/AvatarEditable/AvatarEditable';
import AvatarUploadModal from '../../UI/AvatarUploadModal/AvatarUploadModal';
import verificateType from '../../constants/type/verificateTokenEnum';
import ProfileEdit from '../../components/Profile/ProfileEdit/ProfileEdit';
import ConfirmModal from '../../UI/ConfirmModal/ConfirmModal';
import { uploadUserAvatar, selectUserAvatar, deleteUserAvatar } from '../../api/fileFetch';
import { countValidGroups, groupLabel } from '../../helper/groupHelper';

const GroupsCards = ({ userGroups, checkInvite = false }) => {
    const { t } = useTranslation();
    return userGroups.filter((groupInfo) => groupInfo?.group).map((groupInfo) => {
        const { group } = groupInfo;
        let isVerificate = false
        if (checkInvite) {
            isVerificate = !groupInfo.actionToken && groupInfo.type === verificateType.VERIFIED_TYPE
        }
        return (<GroupCard
            key={groupInfo._id}
            id={group._id}
            avatar={group.avatar}
            title={groupLabel(group, t)}
            description={group.description}
            status={groupInfo.type}
            usersCount={group.userCount}
            maxCount={group.parameters?.usersLimit}
            statusName={groupInfo.role ? t(`roles.${groupInfo.role}`) : groupInfo.type}
            isVerificate={isVerificate}
            actionToken={groupInfo.actionToken}
            isView={true}
        />)
    }
    );
}

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userInfo = useSelector((state) => state.auth.userInfo);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);

    useEffect(() => {
        if (!userInfo?.nickname) {
            dispatch(fetchUserInfo(navigate))
                .then(() => setLoading(false))
                .catch((err) => {
                    console.error(err);
                    setError(t('profile.loadError'));
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [dispatch, navigate, userInfo?.nickname]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!userInfo?.nickname) {
        return null;
    }

    const userGroups = userInfo.groups || [];
    const userContacts = userInfo.contacts || {};

    const hasContactInfo = Object.values(userContacts).some((contactValue) => contactValue);

    const getAge = (dateString) => {
        const birthDate = new Date(dateString);
        if (!dateString || Number.isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    const userAge = getAge(userInfo.birthday);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        dispatch(authAction.logOutAuth());
        navigate('/sign?mode=signIn');
    };

    const refreshUser = () => dispatch(fetchUserInfo(navigate));
    const withRefresh = (apiCall) => async (...args) => {
        const res = await apiCall(...args);
        if (res && res.ok !== false) refreshUser();
        return res;
    };
    const handleAvatarUpload = withRefresh(uploadUserAvatar);
    const handleAvatarSelect = withRefresh(selectUserAvatar);
    const handleAvatarDelete = withRefresh(deleteUserAvatar);

    return (
        <div>
            <HeaderImg position={'absolute'} />
            <div className={classes.content}>
                <div className={classes.userBox}>
                    <AvatarEditable
                        size={'large'}
                        src={userInfo.avatar?.location || null}
                        onEdit={() => setIsAvatarOpen(true)}
                    />
                    <div className={classes.userInfo}>
                        <h1>{userInfo.fullName}</h1>
                        <div className={classes.userNickname}>{userInfo.nickname}</div>
                        <div className={classes.contactInfoMain}>
                            <Button beforeImg={contactImages.gmail} padding={'4px 16px'}>
                                {userInfo.email}
                            </Button>
                            {userAge !== null && (
                                <Button beforeImg='edit' padding={'4px 16px'}>
                                    {t('profile.age')}: {userAge}
                                </Button>
                            )}
                            {userInfo.phone && (
                                <Button beforeImg={contactImages.phone} padding={'4px 16px'}>
                                    {userInfo.phone}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <div className={classes.userContact}>
                    {hasContactInfo && <p>{t('profile.about')}</p>}
                    {Object.entries(userContacts).map(([contactType, contactValue]) => (
                        contactValue && (
                            <div key={contactType} className={classes.contactBox}>
                                <img src={contactImages[contactType.toLowerCase()]} alt={contactType} />
                                <div>{contactValue}</div>
                            </div>
                        )
                    ))}
                </div>
                <div className={classes.groupsBox}>
                    <h4>{t('profile.groups')} ({countValidGroups(userGroups)}/5):</h4>
                    {userGroups.length ? (
                        <GroupsCards userGroups={userGroups} checkInvite={true}/>
                    ) : (
                        <NotFoundGroups className={classes.notFoundGroups} />
                    )}
                </div>
                <div className={classes.buttonBox}>
                    <Button onClick={() => setShowLogoutConfirm(true)}>{t('profile.logout')}</Button>
                    <Button typeColor='green' onClick={() => setIsEditOpen(true)}>{t('profile.edit')}</Button>
                </div>
            </div>
            {isAvatarOpen && (
                <AvatarUploadModal
                    title={t('profile.changePhoto')}
                    gallery={userInfo.avatarGallery || []}
                    currentAvatarId={userInfo.avatar?._id || null}
                    onUpload={handleAvatarUpload}
                    onSelect={handleAvatarSelect}
                    onDelete={handleAvatarDelete}
                    modalClose={() => setIsAvatarOpen(false)}
                />
            )}
            {isEditOpen && <ProfileEdit onClose={() => setIsEditOpen(false)} />}
            {showLogoutConfirm && (
                <ConfirmModal
                    title={t('profile.logout')}
                    message={t('profile.logoutConfirmMessage')}
                    confirmText={t('profile.logoutConfirmButton')}
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}
        </div>
    );
}

export default ProfilePage;
