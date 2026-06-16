import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OnboardingTour from './OnboardingTour';
import { TOUR_SECTIONS, markAllToursDone } from '../../helper/onboarding';

const NavigationTour = () => {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const userInfo = useSelector((state) => state.auth.userInfo);
    const isLogin = !!userInfo?.id;

    useEffect(() => {
        if (userInfo?.tourCompleted) markAllToursDone();
    }, [userInfo?.tourCompleted]);

    const steps = useMemo(() => [
        {
            target: '[data-tour="nav-home"]',
            title: t('tour.nav.homeTitle'),
            content: t('tour.nav.homeText'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="nav-user"]',
            title: t('tour.nav.profileTitle'),
            content: t('tour.nav.profileText'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="nav-groups"]',
            title: t('tour.nav.groupsTitle'),
            content: t('tour.nav.groupsText'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="nav-schedule"]',
            title: t('tour.nav.scheduleTitle'),
            content: t('tour.nav.scheduleText'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="nav-help"]',
            title: t('tour.nav.helpTitle'),
            content: t('tour.nav.helpText'),
            placement: 'bottom',
        },
    ], [t]);

    return (
        <OnboardingTour
            section={TOUR_SECTIONS.NAVIGATION}
            steps={steps}
            enabled={isLogin && pathname === '/profile'}
        />
    );
};

export default NavigationTour;
