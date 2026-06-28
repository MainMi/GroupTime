import React, { useEffect } from 'react';
import classes from './Toast.module.scss';

// Leading glyph per toast type so the kind of message reads at a glance.
const ICONS = {
  success: '✓',
  error: '⚠',
  warning: '⚠',
  info: 'ℹ',
};

const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    onClose(id);
  };

  return (
    <div className={`${classes.toast} ${classes[type] || classes.info}`} role="alert">
      <span className={classes.icon} aria-hidden="true">{ICONS[type] || ICONS.info}</span>
      <span className={classes.message}>{message}</span>
      <button className={classes.close} onClick={handleClose} aria-label="close">
        ×
      </button>
    </div>
  );
};

export default Toast;
