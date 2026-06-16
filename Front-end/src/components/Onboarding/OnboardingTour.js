import { useCallback, useEffect, useRef, useState } from 'react';
import { Joyride, EVENTS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import {
    isTourDone,
    markTourDone,
    markAllToursDone,
    areAllToursDone,
    syncTourComplete,
    registerTourResponder,
} from '../../helper/onboarding';
import { completeTour } from '../../api/userFetch';
import TourTooltip from './TourTooltip';

const STEP_DURATION_MS = 6000;

const tourOptions = {
    primaryColor: '#336F36',
    textColor: '#414141',
    backgroundColor: '#fff',
    arrowColor: '#fff',
    overlayColor: 'rgba(17, 17, 17, 0.6)',
    zIndex: 10000,
    spotlightRadius: 12,
    skipBeacon: true,
    overlayClickAction: 'next',
};

const OnboardingTour = ({ section, steps, enabled = true, restartPriority = 0 }) => {
    const navigate = useNavigate();
    const [run, setRun] = useState(false);
    const [shownStep, setShownStep] = useState(null);
    const [dontShowAll, setDontShowAll] = useState(false);
    const controlsRef = useRef(null);

    useEffect(() => {
        if (!enabled || isTourDone(section)) return undefined;
        const id = setTimeout(() => setRun(true), 700);
        return () => clearTimeout(id);
    }, [enabled, section]);

    useEffect(
        () =>
            registerTourResponder(() => {
                setRun(true);
                setTimeout(() => controlsRef.current?.reset(true), 0);
            }, restartPriority),
        [restartPriority]
    );

    useEffect(() => {
        if (!run || shownStep === null) return undefined;
        const id = setTimeout(() => controlsRef.current?.next(), STEP_DURATION_MS);
        return () => clearTimeout(id);
    }, [run, shownStep]);

    const finish = useCallback(() => {
        setRun(false);
        setShownStep(null);
        if (dontShowAll) {
            markAllToursDone();
            syncTourComplete(completeTour, navigate);
            return;
        }
        markTourDone(section);
        if (areAllToursDone()) syncTourComplete(completeTour, navigate);
    }, [dontShowAll, section, navigate]);

    const handleEvent = (data, controls) => {
        controlsRef.current = controls;
        if (data.type === EVENTS.TOOLTIP) {
            setShownStep({ index: data.index, shownAt: Date.now() });
        } else if (data.type === EVENTS.TOUR_END) {
            finish();
        }
    };

    const toggleDontShow = useCallback((ev) => setDontShowAll(ev.target.checked), []);

    const renderTooltip = useCallback(
        (props) => (
            <TourTooltip
                {...props}
                stepDurationMs={STEP_DURATION_MS}
                dontShowAll={dontShowAll}
                onToggleDontShow={toggleDontShow}
            />
        ),
        [dontShowAll, toggleDontShow]
    );

    if (!steps?.length) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            scrollToFirstStep
            onEvent={handleEvent}
            options={tourOptions}
            tooltipComponent={renderTooltip}
        />
    );
};

export default OnboardingTour;
