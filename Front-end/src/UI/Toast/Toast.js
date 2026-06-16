import React, { useEffect } from 'react';
import classes from './Toast.module.scss';

const Toast = ({ id, type = 'info', message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleClose = () => {
    onClose(id);
  };

  return (
    <div className={`${classes.toast} ${classes[type] || classes.info}`}>
      <span className={classes.message}>{message}</span>
      <button className={classes.close} onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;
