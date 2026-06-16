import classes from './Header.module.scss'
import groupsIcon from '../../static/image/menuIcons/groupsIcon.svg'
import userIcon from '../../static/image/menuIcons/userIcon.svg'
import scheduleIcon from '../../static/image/menuIcons/scheduleIcon.svg'
import homeIcon from '../../static/image/menuIcons/homeIcon.svg'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { restartTours } from '../../helper/onboarding'

const Header = () => {
    const userInfo = useSelector((state) => state.auth.userInfo);
    const isLogin = userInfo?.id;
    const { t, i18n } = useTranslation();
    const navLinkHeader = ({ isActive }) => {
        return isActive ? classes.active : undefined;
    }

    const lang = (i18n.resolvedLanguage || i18n.language || 'uk').slice(0, 2);
    const toggleLang = () => i18n.changeLanguage(lang === 'uk' ? 'en' : 'uk');

    return <header className={classes.header}>
        <nav className={classes.navigate}>
            <NavLink className={navLinkHeader} to='/' data-tour="nav-home"><img src={homeIcon} alt={t('header.home')} /></NavLink>
            <NavLink className={navLinkHeader} to={isLogin ? '/profile' : '/sign'} data-tour="nav-user"><img src={userIcon} alt={isLogin ? t('header.user') : t('header.signIn')} /></NavLink>
            {isLogin && (
                <>
                    <NavLink className={navLinkHeader} to='/groups' data-tour="nav-groups"><img src={groupsIcon} alt={t('header.groups')} /></NavLink>
                    <NavLink className={navLinkHeader} to='/schedule' data-tour="nav-schedule"><img src={scheduleIcon} alt={t('header.schedule')} /></NavLink>
                </>
            )}
        </nav>
        <div className={classes.panelBox}>
            <button
                type="button"
                className={classes.langBtn}
                onClick={toggleLang}
                title={t('header.language')}
                aria-label={t('header.language')}
            >
                {lang === 'uk' ? 'EN' : 'UA'}
            </button>
            {isLogin && (
                <button
                    type="button"
                    className={classes.langBtn}
                    onClick={restartTours}
                    title={t('tour.help')}
                    aria-label={t('tour.help')}
                    data-tour="nav-help"
                >
                    ?
                </button>
            )}
        </div>
    </header>
}

export default Header;
