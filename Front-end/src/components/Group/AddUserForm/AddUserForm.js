import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../../UI/Dropdown/Dropdown';
import SearchDropdown from '../../../UI/Dropdown/SearchDropdown';
import ButtonSmall from '../../../UI/Button/ButtonSmall';
import roleEnum from '../../../constants/roleEnum';
import { searchUsers } from '../../../api/userFetch';
import classes from './AddUserForm.module.scss';

const AddUserForm = ({
    onAddUser,
    readyAddUsers,
    navigate,
    editUser
}) => {
    const { t } = useTranslation();
    const [userInfo, setUserInfo] = useState('');
    const [role, setRole] = useState('');
    const [userNameInfo, setUserNameInfo] = useState({
        value: '',
        length: 0,
        isFound: false
    });
    const [searchVal, setSearchVal] = useState(null);
    const [usersInfo, setUsersInfo] = useState([]);
    // Remount key + default index so the role dropdown restores the edited user's role
    const [editToken, setEditToken] = useState(0);
    const [roleDefaultIndex, setRoleDefaultIndex] = useState(0);

    // Live ref so the stable fetchUsers callback can exclude already-queued users
    const readyAddUsersRef = useRef(readyAddUsers);
    readyAddUsersRef.current = readyAddUsers;

    const changeRoleHandler = (value) => setRole(value);

    const changeUserNameInfoHandler = (foundValue = '', value = '') => {
        setUserNameInfo({
            value: foundValue || value,
            length: value.length,
            isFound: !!foundValue?.id
        });
    };

    const dropdownResetRef = useRef(null);
    const searchDropdownResetRef = useRef(null);

    const fetchUsers = useCallback(async (userName) => {
        try {
            let { data: { data = [] } = {}, status } = await searchUsers(userName, navigate);
            if (status !== 200) {
                throw new Error('Search failed');
            }
            const queuedIds = readyAddUsersRef.current.map(({ user }) => user.id);
            data = data.length ? data.filter((user) => !queuedIds.includes(user.id)) : [];
            setUsersInfo(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, [navigate]);

    // Restore the user AND role into the form on edit, and pre-load the
    // search list so the dropdown isn't empty on first click.
    useEffect(() => {
        if (!editUser) {
            return;
        }
        const { user } = editUser.user;
        const editedRole = editUser.user.role;

        setUserNameInfo({
            value: user,
            length: (user.fullName || '').length || 4,
            isFound: true
        });
        setUserInfo(user);
        setSearchVal(user.fullName);

        setRole(editedRole);
        const idx = Object.values(roleEnum).indexOf(editedRole);
        setRoleDefaultIndex(idx >= 0 ? idx : 0);
        setEditToken((token) => token + 1);

        if (user.fullName) fetchUsers(user.fullName);
    }, [editUser, fetchUsers]);

    useEffect(() => {
        if (userNameInfo.isFound) {
            setUserInfo(userNameInfo.value);
        } else if (userNameInfo.length >= 3) {
            fetchUsers(userNameInfo.value);
        }
    }, [userNameInfo, fetchUsers]);

    const isValidSubmit = userNameInfo.isFound && role.length;
    

    const clickAddUserHandler = (event) => {
        event.preventDefault();
        if (!isValidSubmit) return;
        
        onAddUser({ user: userNameInfo.value, role });
        setUsersInfo([]);
        setUserNameInfo({ value: '', length: 0, isFound: false });
        setRole('');
        setSearchVal(null);
        setRoleDefaultIndex(0);
        setEditToken((token) => token + 1);
        if (dropdownResetRef.current) dropdownResetRef.current();
        if (searchDropdownResetRef.current) searchDropdownResetRef.current();
    };
    

    return (
        <div className={classes.addUsersForm} >
            <div className={classes.inputBox}>
                <label>{t('group.fullnameLabel')}</label>
                <SearchDropdown
                    placeholder={t('group.fullnamePlaceholder')}
                    handleChange={changeUserNameInfoHandler}
                    options={usersInfo}
                    isUserFind
                    selectedVal={userInfo}
                    setVal={searchVal}
                    resetFn={(reset) => searchDropdownResetRef.current = reset}
                />
            </div>
            <div className={classes.inputBox}>
                <label>{t('group.userRole')}</label>
                <Dropdown
                    key={`role-${editToken}`}
                    changeValueHandler={changeRoleHandler}
                    classNameButton={classes.dropdown}
                    color="pink"
                    borderRadius={5}
                    defaultIndex={roleDefaultIndex}
                    label={t('group.roleSelect')}
                    arrValue={Object.values(roleEnum)}
                    resetFn={(reset) => dropdownResetRef.current = reset}
                />
            </div>
            <ButtonSmall centerImg="plus" isDisable={!isValidSubmit} onClick={clickAddUserHandler} />
        </div>
    );
};

export default AddUserForm;
