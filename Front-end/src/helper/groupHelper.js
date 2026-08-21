import verificateType from '../constants/type/verificateTokenEnum';
import groupTypeEnum from '../constants/type/groupTypeEnum';

/**
 * Кількість груп користувача, порахована з уже завантаженого масиву `groups`
 * (populate з бекенду) — без додаткових запитів. Враховуються лише підтверджені
 * членства, чия група ще існує; персональний розклад НЕ рахується (він не впливає
 * на ліміт груп), тож число завжди збігається з тим, що бачить користувач.
 * @param {Array} groups - userInfo.groups (масив Verificate з populated `group`)
 * @returns {number}
 */
export const countValidGroups = (groups) =>
    (groups || []).filter(
        (membership) => membership?.group
            && membership.type === verificateType.VERIFIED_TYPE
            && membership.group.type !== groupTypeEnum.PERSONAL_TYPE
    ).length;

export const isVerifiedMembership = (membership) =>
    membership?.type === verificateType.VERIFIED_TYPE;

export const isPersonalGroup = (group) => group?.type === groupTypeEnum.PERSONAL_TYPE;

/**
 * Display label for a group. Personal schedules use a localized name so switching
 * language re-labels them (their stored name is fixed at creation time).
 */
export const groupLabel = (group, t) =>
    (isPersonalGroup(group) ? t('schedule.personalName') : group?.name || '');

export default countValidGroups;
