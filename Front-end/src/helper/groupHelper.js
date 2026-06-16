import verificateType from '../constants/type/verificateTokenEnum';

/**
 * Кількість груп користувача, порахована з уже завантаженого масиву `groups`
 * (populate з бекенду) — без додаткових запитів. Враховуються лише підтверджені
 * членства, чия група ще існує, тож число завжди збігається з тим, що бачить
 * користувач (видалені/недійсні групи не рахуються).
 * @param {Array} groups - userInfo.groups (масив Verificate з populated `group`)
 * @returns {number}
 */
export const countValidGroups = (groups) =>
    (groups || []).filter(
        (membership) => membership?.group && membership.type === verificateType.VERIFIED_TYPE
    ).length;

export default countValidGroups;
