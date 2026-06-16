import { notificationActions } from '../slices/notification-slice';

export const showErrorNotification = (message, duration = 5000) => (dispatch) => {
  dispatch(
    notificationActions.addNotification({
      type: 'error',
      message,
      duration,
    })
  );
};

export const showSuccessNotification = (message, duration = 5000) => (dispatch) => {
  dispatch(
    notificationActions.addNotification({
      type: 'success',
      message,
      duration,
    })
  );
};

export const showInfoNotification = (message, duration = 5000) => (dispatch) => {
  dispatch(
    notificationActions.addNotification({
      type: 'info',
      message,
      duration,
    })
  );
};

export const showWarningNotification = (message, duration = 5000) => (dispatch) => {
  dispatch(
    notificationActions.addNotification({
      type: 'warning',
      message,
      duration,
    })
  );
};
