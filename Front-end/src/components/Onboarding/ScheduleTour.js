import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import OnboardingTour from './OnboardingTour';
import { TOUR_SECTIONS, isTourDone } from '../../helper/onboarding';

const ScheduleTour = ({ enabled, canEdit }) => {
    const { t } = useTranslation();

    const steps = useMemo(() => {
        const base = [
            {
                target: '[data-tour="schedule-group"]',
                title: t('tour.schedule.groupTitle'),
                content: t('tour.schedule.groupText'),
                placement: 'bottom',
            },
            {
                target: '[data-tour="schedule-assistant"]',
                title: t('tour.schedule.assistantTitle'),
                content: t('tour.schedule.assistantText'),
                placement: 'bottom',
            },
        ];
        if (canEdit) {
            base.push({
                target: '[data-tour="schedule-create"]',
                title: t('tour.schedule.createTitle'),
                content: t('tour.schedule.createText'),
                placement: 'bottom',
            });
        }
        return base;
    }, [t, canEdit]);

    return (
        <OnboardingTour
            section={TOUR_SECTIONS.SCHEDULE}
            steps={steps}
            enabled={enabled && isTourDone(TOUR_SECTIONS.NAVIGATION)}
            restartPriority={1}
        />
    );
};

export default ScheduleTour;
