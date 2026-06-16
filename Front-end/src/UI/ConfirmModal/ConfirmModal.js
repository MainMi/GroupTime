import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import classes from './ConfirmModal.module.scss';

const ConfirmModal = ({
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    return (
        <Modal onHiddenCart={onCancel} modalClassname={classes.modal}>
            <div className={classes.box}>
                <h3 className={classes.title}>{title ?? t('confirm.title')}</h3>
                {message && <p className={classes.message}>{message}</p>}
                <div className={classes.actions}>
                    <Button typeBtn="button" type="noBorder" onClick={onCancel}>
                        {cancelText ?? t('common.cancel')}
                    </Button>
                    <Button typeBtn="button" typeColor="green" onClick={onConfirm}>
                        {confirmText ?? t('confirm.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
