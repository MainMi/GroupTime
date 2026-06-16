import {
    showErrorNotification,
    showSuccessNotification,
    showInfoNotification,
    showWarningNotification,
} from '../redux/actions/notification-actions';

// Holds the store dispatch so non-thunk modules (api layer) can raise toasts.
let _dispatch = null;

export const registerNotifyDispatch = (dispatch) => {
    _dispatch = dispatch;
};

export const notifyError = (message) => {
    if (_dispatch) _dispatch(showErrorNotification(message));
};

export const notifySuccess = (message) => {
    if (_dispatch) _dispatch(showSuccessNotification(message));
};

export const notifyInfo = (message) => {
    if (_dispatch) _dispatch(showInfoNotification(message));
};

export const notifyWarning = (message) => {
    if (_dispatch) _dispatch(showWarningNotification(message));
};
