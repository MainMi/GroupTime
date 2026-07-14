import urlEnum from "../constants/urlEnum";
import { fetchAuth } from "../redux/actions/auth-actions";
import { schedulehAction } from "../redux/slices/schedule-slice";

export function getScheduleWeekInfo(data, navigate) {
  let { date, groupId } = data;

  return async (dispatch) => {
    const result = await fetchAuth({
      url: urlEnum.scheduleWeekInfo,
      method: 'POST',
      body: { date, groupId }
    }, navigate);

    if (result && result.data) {
      const response = result.data; // { staticWeek, dynamicWeek, staticWeeksCount, countWeek, version }
      dispatch(schedulehAction.addSchedule({
        data: response,
        date: date.toISOString(),
        groupId,
        staticWeeksCount: response.staticWeeksCount,
        version: response.version,
      }));
    }

    return result;
  };
}

// Lightweight change-detection: returns { data: { version, countWeek }, ok }.
export function getScheduleVersion(data, navigate) {
  return fetchAuth({
    url: urlEnum.scheduleWeekVersion,
    method: 'POST',
    body: { date: data.date, groupId: data.groupId },
  }, navigate);
}

export function getStaticWeeksList(data, navigate) {
  return fetchAuth({
    url: urlEnum.scheduleStaticWeeksList,
    method: 'POST',
    body: { groupId: data.groupId }
  }, navigate);
}

export function addStaticWeekToGroup(data, navigate) {
  return fetchAuth({
    url: urlEnum.scheduleAddStatic,
    method: 'POST',
    body: { groupId: data.groupId }
  }, navigate);
}

// Delete a static week. The backend resolves the static week from the ISO week
// of `date` (modulo the static week count), so callers pass a date whose ISO
// week maps to the target static week index.
export function deleteStaticWeek(data, navigate) {
  return fetchAuth({
    url: urlEnum.scheduleDelete,
    method: 'POST',
    body: { groupId: data.groupId, date: data.date, isStatic: true }
  }, navigate);
}

// Reorder two static weeks by swapping their order index (countWeek).
export function swapStaticWeeks(data, navigate) {
  return fetchAuth({
    url: urlEnum.scheduleStaticSwap,
    method: 'POST',
    body: { groupId: data.groupId, weekId1: data.weekId1, weekId2: data.weekId2 }
  }, navigate);
}

// Get the group's .ics subscription link (created on first request). Returns
// { data: { url, token }, ok }.
export function getCalendarSubscribeUrl(data, navigate) {
  return fetchAuth({
    url: urlEnum.calendarSubscribe,
    method: 'POST',
    body: { groupId: data.groupId }
  }, navigate);
}

// Rotate the group's subscription token, revoking any existing feed URL.
export function regenerateCalendarSubscribeUrl(data, navigate) {
  return fetchAuth({
    url: urlEnum.calendarRevoke,
    method: 'POST',
    body: { groupId: data.groupId }
  }, navigate);
}

// Common free slots across several of the user's own groups (union busy → free).
// Returns { data: { free, busy, countWeek, groups }, ok }.
export function getGroupFreeSlots(data, navigate) {
  return fetchAuth({
    url: urlEnum.availabilitySlots,
    method: 'POST',
    body: { groupIds: data.groupIds || [], date: data.date }
  }, navigate);
}

// One member's availability across all their groups (co-members only).
// Returns { data: { free, busy, countWeek }, ok }.
export function getMemberFreeSlots(data, navigate) {
  return fetchAuth({
    url: urlEnum.availabilityMember,
    method: 'POST',
    body: { groupId: data.groupId, userId: data.userId, date: data.date }
  }, navigate);
}
