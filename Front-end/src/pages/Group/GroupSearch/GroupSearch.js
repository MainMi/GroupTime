import React, { useEffect, useState } from 'react';
import GroupCard from '../../../UI/GroupCard/GroupCard';
import HeaderImg from '../../../UI/HeaderImg/HeaderImg';
import classes from './GroupsSearch.module.scss';
import searchIcon from '../../../static/image/inputIcons/searchIcon.svg';
import Button from '../../../UI/Button/Button';
import NotFoundGroups from '../../../components/Group/NotFoundGroups/NotFoundGroups';
import { useNavigate } from 'react-router-dom';
import useInput from '../../../hooks/useInput';
import validateFn from '../../../constants/validateFn.enum';
import Input from '../../../UI/Input/Input';
import { notifyError } from '../../../helper/notify';
import { searchGroups } from '../../../api/groupFetch';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchUserInfo } from '../../../redux/actions/auth-actions';
import GroupTour from '../../../components/Onboarding/GroupTour';
import groupEnum from '../../../constants/groupEnum';

const GroupsCards = ({ groups, userGroups }) => {
    const groupIds = userGroups?.map((verificate) => verificate.group._id || verificate.group.id) || [];
    
    return (
        <div className={classes.groupsBox}>
            {groups.map((group) => (
                <GroupCard
                    id={group._id}
                    key={group._id}
                    avatar={group.avatar}
                    title={group.name}
                    description={group.description}
                    status={group.type}
                    usersCount={group.userCount}
                    maxCount={group.parameters?.usersLimit}
                    type='add'
                    isView={groupIds.includes(group._id)}
                />
            ))}
        </div>
    );
};

const GroupSearch = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const userInfo = useSelector((state) => state.auth.userInfo);

    const {
        value: valueGroup,
        valueChangeHandler: groupChangeHandler, inputBlurHandler: groupBlurHandler,
    } = useInput(validateFn.isNotEmptyFn, 'Group');

    const [groupNameInfo, setGroupNameInfo] = useState('');
    const [groupsInfo, setGroupsInfo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!userInfo?.nickname) {
            dispatch(fetchUserInfo(navigate))
                .then(() => setLoading(false))
                .catch((err) => {
                    console.error(err);
                    notifyError(t('profile.loadError'));
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [dispatch, navigate, userInfo?.nickname]);

    useEffect(() => {
        const query = groupNameInfo.trim();
        if (query.length < groupEnum.MIN_SEARCH_LENGTH) {
            setGroupsInfo([]);
            return;
        }

        const getData = async () => {
            setIsSearching(true);
            try {
                const response = await searchGroups(query);
                const results = response?.data?.data || response?.data || [];
                setGroupsInfo(Array.isArray(results) ? results : []);
            } catch (error) {
                console.error('Error fetching group:', error);
                setGroupsInfo([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(() => { getData(); }, groupEnum.SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(debounceTimer);
    }, [groupNameInfo]);

    if (loading) return <div>{t('common.loading')}</div>;

    const myGroups = userInfo?.groups?.map(g => g.group) || [];
    const isSearchEmpty = groupNameInfo.trim().length < groupEnum.MIN_SEARCH_LENGTH;

    return (
        <div className={classes.content}>
            <HeaderImg />
            <div className={classes.container}>
                <h1>{t('group.search')}</h1>
                <div className={classes.searchBox} data-tour="group-search">
                    <img src={searchIcon} alt='search' />
                    <Input
                        name='search'
                        className={classes.searchInput}
                        placeholder={t('group.searchPlaceholder')}
                        value={valueGroup}
                        onChange={(e) => {
                            groupChangeHandler(e);
                            setGroupNameInfo(e.target.value);
                        }}
                        onBlur={groupBlurHandler}
                    />
                    
                </div>

                {!isSearchEmpty ? (
                    isSearching ? (
                        <div className={classes.loadingText}>{t('group.searching')}</div>
                    ) : groupsInfo.length > 0 ? (
                        <GroupsCards groups={groupsInfo} userGroups={userInfo?.groups} />
                    ) : (
                        <NotFoundGroups />
                    )
                ) : null}


                {isSearchEmpty && myGroups.length > 0 && (
                    <div style={{ width: '100%', marginTop: '30px' }}>
                        <h2 style={{ marginBottom: '15px' }}>{t('group.myGroups')}</h2>
                        <GroupsCards groups={myGroups} userGroups={userInfo?.groups} />
                    </div>
                )}

                <div className={classes.buttonBox} style={{ marginTop: '20px' }}>
                    <span data-tour="group-create" style={{ display: 'inline-flex' }}>
                        <Button onClick={() => navigate('/groups/edit')}>{t('group.createButton')}</Button>
                    </span>
                </div>
            </div>
            <GroupTour enabled={!loading} />
        </div>
    );
};

export default GroupSearch;