import { fetchAuth } from '../redux/actions/auth-actions';
import urlEnum from '../constants/urlEnum';
import { getAccessToken } from '../helper/authToken';

// Додавання статичної події
export function addStaticEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventAddStatic,
    method: 'POST',
    body: data
  }, navigate);
}

// Додавання динамічної події
export function addDynamicEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventAddDynamic,
    method: 'POST',
    body: data
  }, navigate);
}

// Додавання повторюваної (щотижневої) динамічної події
export function addRecurringEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventAddRecurring,
    method: 'POST',
    body: data
  }, navigate);
}

// Редагування події
export function editEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventEdit,
    method: 'POST',
    body: data
  }, navigate);
}

// Видалення статичної події
export function deleteStaticEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventDeleteStatic,
    method: 'POST',
    body: data
  }, navigate);
}

// Видалення динамічної події
export function deleteDynamicEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventDeleteDynamic,
    method: 'POST',
    body: data
  }, navigate);
}

// Отримання розкладу (тиждень) - already in scheduleFetch.js
// export function getScheduleWeek(data, navigate) {
//   return fetchAuth({
//     url: urlEnum.scheduleWeekInfo,
//     method: 'POST',
//     body: data
//   }, navigate);
// }

// Додавання файлу до події (multipart/form-data: eventDateId + data)
// The backend reads the raw token from the Authorization header (no "Bearer "
// prefix) — mirror fetchAuth so uploads authenticate the same way. Don't set
// Content-Type: the browser adds the multipart boundary automatically.
export async function addFileToEvent(formData, navigate) {
  const authToken = getAccessToken();

  const url = urlEnum.eventAddFile;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authToken || '',
      },
      body: formData,
    });
    const data = await response.json();
    return { data, status: response.status, ok: response.ok };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, ok: false };
  }
}

// Імпорт подій з .ics (Google/Outlook/Apple Calendar)
export function importEvents(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventImport,
    method: 'POST',
    body: data,
  }, navigate);
}

// Видалення файлу з події
export function deleteFileFromEvent(data, navigate) {
  return fetchAuth({
    url: urlEnum.eventDeleteFile,
    method: 'POST',
    body: data,
  }, navigate);
}
