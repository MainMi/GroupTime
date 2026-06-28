import classes from './AboutPage.module.scss'
import HeaderImg from "../../UI/HeaderImg/HeaderImg";
import logoIcon from '../../static/image/globalcons/logo.svg'
import { useTranslation } from 'react-i18next';


const AboutPage = () => {
    const { t } = useTranslation();
    return <>
    <HeaderImg/>
    <div className={classes.content}>
        <div className={classes.gridBox}>
        <div className={classes.aboutBox}>
            <div className={classes.imgBox}>
                <img src={logoIcon} alt='Logo'></img>
            </div>
            <div className={classes.textBox}>
                <h1>GroupTime</h1>
                <p><span>GroupTime</span> {t('about.p1')}</p>

                <p>{t('about.p2')}</p>

                <p>{t('about.p3')}</p>

                <p>{t('about.p4')}</p>
            </div>
        </div>
        </div>
    </div>
    </>
}

export default AboutPage;