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
        {/* <div className={classes.teamBox}>
            <h2>Наша Команда</h2>
            <div className={classes.teamGrid}>
                <ContactInfo teamName='Mykyta' isContact={true}/>
                <ContactInfo teamName='Maxim' isContact={true}/>
                <ContactInfo teamName='Anna' isContact={true}/>
                <ContactInfo teamName='Uliana' isContact={true}/>
            </div>
        </div> */}
        </div>
    </div>
    </>
}

export default AboutPage;