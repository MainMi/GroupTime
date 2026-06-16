import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Toast from './Toast';
import { notificationActions } from '../../redux/slices/notification-slice';
import classes from './ToastContainer.module.scss';

const ToastContainer = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notification);

  const handleClose = (id) => {
    dispatch(notificationActions.removeNotification(id));
  };

  return (
    <div className={classes.toastContainer}>
      {notifications.map((notif) => (
        <Toast
          key={notif.id}
          id={notif.id}
          type={notif.type}
          message={notif.message}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
