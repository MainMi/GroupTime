import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import classes from './NotFoundGroups.module.scss'

const NotFoundGroups = (props) => {
    const { t } = useTranslation();
    return (
        <div className={`${classes.notFound} ${props.className}`}>
            <p>{t('group.notFound')} <Link to="/groups/edit">{t('group.notFoundCreate')}</Link></p>
        </div>
    )
}

export default NotFoundGroups;
