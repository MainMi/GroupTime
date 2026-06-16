import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import OnboardingTour from './OnboardingTour';
import { TOUR_SECTIONS, isTourDone } from '../../helper/onboarding';

const GroupTour = ({ enabled }) => {
    const { t } = useTranslation();

    const steps = useMemo(() => [
        {
            target: '[data-tour="group-search"]',
            title: t('tour.group.searchTitle'),
            content: t('tour.group.searchText'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="group-create"]',
            title: t('tour.group.createTitle'),
            content: t('tour.group.createText'),
            placement: 'top',
        },
    ], [t]);

    return (
        <OnboardingTour
            section={TOUR_SECTIONS.GROUP}
            steps={steps}
            enabled={enabled && isTourDone(TOUR_SECTIONS.NAVIGATION)}
            restartPriority={1}
        />
    );
};

export default GroupTour;
