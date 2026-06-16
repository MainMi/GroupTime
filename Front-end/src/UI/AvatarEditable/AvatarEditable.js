import { useTranslation } from 'react-i18next';
import AvatarImg from '../AvatarImg/AvatarImg';
import Button from '../Button/Button';
import buttonsImages from '../../static/image/buttonIcons';
import classes from './AvatarEditable.module.scss';

// Avatar frame with an edit affordance: a camera icon overlays the frame on hover
// and a small "change photo" button sits below it. Both call onEdit.
const AvatarEditable = ({
    src = null,
    size = 'large',
    onEdit,
    buttonLabel,
}) => {
    const { t } = useTranslation();
    const label = buttonLabel ?? t('avatar.changePhoto');
    return (
        <div className={classes.wrapper}>
            <div className={classes.frame} onClick={onEdit} title={label}>
                <AvatarImg size={size} src={src} />
                <div className={classes.overlay}>
                    <img src={buttonsImages.camera} alt="camera" />
                </div>
            </div>
            <Button typeColor="green" padding="4px 14px" onClick={onEdit}>
                {label}
            </Button>
        </div>
    );
};

export default AvatarEditable;
