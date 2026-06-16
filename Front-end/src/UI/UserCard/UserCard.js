import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import verificateType from '../../constants/type/verificateTokenEnum';
import roleEnum from '../../constants/roleEnum';
import AvatarImg from '../AvatarImg/AvatarImg';
import ButtonSmall from '../Button/ButtonSmall';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import classes from './UserCard.module.scss';
import { deleteInviteGroup, getGroupInfo, changeUserRole } from '../../api/groupFetch';
import ModalChat from '../../components/Group/ModalChat/ModalChat';

// owner is intentionally absent — ownership is granted only via transfer, not the role menu.
// title holds an i18n key, resolved at render time.
const ROLE_OPTIONS = [
    { title: 'userCard.roleMember', value: roleEnum.USER_ROLE },
    { title: 'userCard.roleStudent', value: roleEnum.STUDENT_ROLE },
    { title: 'userCard.roleHelpAdmin', value: roleEnum.HELP_ADMIN_ROLE },
    { title: 'userCard.roleAdmin', value: roleEnum.ADMIN_ROLE },
];

const UserCard = ({
    userInfo,
    ifSelf,
    isAdmin = false,
    isOwner = false,
    groupId,
    isEditMode = false,
    onStageRemoval = null,
    onTransferOwnership = null,
    isStaged = false,
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChangingRole, setIsChangingRole] = useState(false);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);

    const { user, role, actionToken } = userInfo;
    const isVerificate = userInfo.type === verificateType.VERIFIED_TYPE;
    const isPending = !isVerificate && !!actionToken;
    const isMemberOwner = role === roleEnum.OWNER_ROLE;
    // The viewing owner can hand ownership to any other verified, non-owner member.
    const canTransfer = isOwner && !ifSelf && isVerificate && !isMemberOwner && !!onTransferOwnership;

    const handleDeleteInvite = async () => {
        await deleteInviteGroup(actionToken);
        dispatch(getGroupInfo(groupId || userInfo.groupId, navigate));
    };

    const handleRoleChange = async (newRole) => {
        if (isChangingRole) return;
        setIsChangingRole(true);
        try {
            await changeUserRole({
                userId: user._id,
                groupId: groupId || userInfo.groupId,
                role: newRole,
            }, navigate);
            dispatch(getGroupInfo(groupId || userInfo.groupId, navigate));
        } catch (e) {
            console.error('Role change failed:', e);
        } finally {
            setIsChangingRole(false);
        }
    };

    const handleRoleSelect = (newRole) => {
        setIsRoleMenuOpen(false);
        if (newRole !== role) handleRoleChange(newRole);
    };

    return (
        <div className={`${classes.userCard} ${isPending ? classes.notVerify : ''} ${isStaged ? classes.staged : ''}`}>
            <AvatarImg size="small" src={user.avatar?.location || null} />
            <div className={classes.userInfo}>
                <h3>
                    {user.fullName}
                    <span className={classes.nickname}>(@{user.nickname})</span>
                </h3>
                <div className={classes.userStatus}>
                    <span className={`${classes.roleTag} ${isPending ? classes.roleTagPending : ''}`}>{role}</span>
                    {isPending && !isStaged && <span className={classes.pendingTag}>{t('userCard.pending')}</span>}
                    {isStaged && <span className={classes.stagedTag}>{t('userCard.willBeRemoved')}</span>}
                </div>
            </div>

            <div className={classes.actions}>
                {!ifSelf && (
                    <ButtonSmall
                        centerImg="message"
                        onClick={() => setIsModalOpen(true)}
                        aria-label={t('userCard.writeMessage')}
                    />
                )}
                {/* Manager-only, edit-mode only: hand ownership to this member */}
                {canTransfer && isEditMode && (
                    <ButtonSmall
                        centerImg="people-green"
                        typeColor="green"
                        onClick={() => setShowTransferConfirm(true)}
                        title={t('userCard.transferOwnership')}
                        aria-label={t('userCard.transferOwnership')}
                    />
                )}
                {/* Manager-only, edit-mode only: pick a role (not for the owner) */}
                {isAdmin && !ifSelf && isVerificate && isEditMode && !isMemberOwner && (
                    <div className={classes.roleEditor}>
                        <ButtonSmall
                            centerImg="edit"
                            typeColor="green"
                            onClick={() => setIsRoleMenuOpen((open) => !open)}
                            disabled={isChangingRole}
                            title={t('userCard.changeRole')}
                            aria-label={t('userCard.changeRole')}
                        />
                        {isRoleMenuOpen && (
                            <ul className={classes.roleMenu}>
                                {ROLE_OPTIONS.map((opt) => (
                                    <li
                                        key={opt.value}
                                        className={`${classes.roleMenuItem} ${role === opt.value ? classes.activeRole : ''}`}
                                        onClick={() => handleRoleSelect(opt.value)}
                                    >
                                        {t(opt.title)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                {/* Remove a verified member (edit-mode only); staged and applied on Save. Owner can't be removed. */}
                {isAdmin && !ifSelf && isVerificate && isEditMode && !isMemberOwner && (
                    <ButtonSmall
                        centerImg={isStaged ? 'check' : 'trash'}
                        typeColor={isStaged ? 'green' : 'pink'}
                        onClick={() => (onStageRemoval ? onStageRemoval(userInfo) : null)}
                        title={isStaged ? t('userCard.restore') : t('userCard.removeFromGroup')}
                        aria-label={isStaged ? t('userCard.restore') : t('userCard.removeFromGroup')}
                    />
                )}
                {/* Cancel pending invite (edit-mode only); staged and applied on Save */}
                {isAdmin && isPending && isEditMode && (
                    <ButtonSmall
                        centerImg={isStaged ? 'check' : 'close'}
                        typeColor={isStaged ? 'green' : 'pink'}
                        onClick={() => (onStageRemoval ? onStageRemoval(userInfo) : handleDeleteInvite())}
                        title={isStaged ? t('userCard.restore') : t('userCard.deleteInvite')}
                        aria-label={isStaged ? t('userCard.restore') : t('userCard.deleteInvite')}
                    />
                )}
            </div>

            {isModalOpen && (
                <ModalChat modalClose={() => setIsModalOpen(false)} connectUserId={user._id} />
            )}

            {showTransferConfirm && (
                <ConfirmModal
                    title={t('userCard.transferOwnership')}
                    message={t('userCard.transferConfirmMessage', { name: user.fullName, nickname: user.nickname })}
                    confirmText={t('userCard.transferConfirmButton')}
                    onConfirm={() => {
                        setShowTransferConfirm(false);
                        onTransferOwnership(user._id);
                    }}
                    onCancel={() => setShowTransferConfirm(false)}
                />
            )}
        </div>
    );
};

export default UserCard;
