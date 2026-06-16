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

export function getLastMessages(navigate) {
    const url = urlEnum.messageGetLast;
    const responseFn = (data, navigate, dispatch) => {
        dispatch(messagesAction.updateMessages(data));
    };
    return fetchAuthDispatch(responseFn, navigate, { url, method: 'GET' });
}
