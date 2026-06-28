import urlEnum from "../constants/urlEnum";
import { fetchAuth, fetchAuthDispatch } from "../redux/actions/auth-actions";
import { messagesAction } from "../redux/slices/message-slice";

// Returns { data: [userMsg, assistantMsg], ok, status } so the caller can handle the response directly.
export function sendMessage(data, navigate) {
    return fetchAuth({
        url: urlEnum.messageSend,
        method: 'POST',
        body: data,
    }, navigate);
}

// Detect schedule problems for the selected groups/week.
// Returns { data: { issues, reply }, ok, status }.
export function analyzeSchedule(data, navigate) {
    return fetchAuth({
        url: urlEnum.messageAnalyze,
        method: 'POST',
        body: data,
    }, navigate);
}

// "/magic": parse a create/edit request into structured, confirmable actions.
// Returns { data: { messages: [...], actions: [...] }, ok, status }.
export function sendMagic(data, navigate) {
    return fetchAuth({
        url: urlEnum.messageMagic,
        method: 'POST',
        body: data,
    }, navigate);
}

// "/organizer": propose tags for the selected groups' events.
// Returns { data: { messages: [...], actions: [...] }, ok, status }.
export function organizeSchedule(data, navigate) {
    return fetchAuth({
        url: urlEnum.messageOrganize,
        method: 'POST',
        body: data,
    }, navigate);
}

// Persist client-built messages (e.g. the localized analysis result) so they
// survive a reload. Returns { data: [createdMsg...], ok, status }.
export function persistMessages(messages, navigate) {
    return fetchAuth({
        url: urlEnum.messagePersist,
        method: 'POST',
        body: { messages },
    }, navigate);
}

export function getLastMessages(navigate) {
    const url = urlEnum.messageGetLast;
    const responseFn = (data, navigate, dispatch) => {
        dispatch(messagesAction.updateMessages(data));
    };
    return fetchAuthDispatch(responseFn, navigate, { url, method: 'GET' });
}
