import { useTranslation } from 'react-i18next';
import Button from '../../UI/Button/Button';
import Checkbox from '../../UI/Checkbox/Checkbox';
import classes from './TourTooltip.module.scss';

const TourTooltip = ({
    index,
    size,
    step,
    isLastStep,
    backProps,
    primaryProps,
    tooltipProps,
    stepDurationMs,
    dontShowAll,
    onToggleDontShow,
}) => {
    const { t } = useTranslation();

    return (
        <div className={classes.tooltip} {...tooltipProps}>
            {step.title && <h4 className={classes.title}>{step.title}</h4>}
            <div className={classes.body}>{step.content}</div>

            <div className={classes.timerTrack} aria-hidden="true">
                <div
                    key={index}
                    className={classes.timerFill}
                    style={{ animationDuration: `${stepDurationMs}ms` }}
                />
            </div>

            <Checkbox
                typeColor="green"
                value={dontShowAll}
                onChange={onToggleDontShow}
                labelClassName={classes.dontShow}
            >
                {t('tour.dontShowAgain')}
            </Checkbox>

            <div className={classes.footer}>
                <span className={classes.progress}>{index + 1}/{size}</span>
                <div className={classes.actions}>
                    {index > 0 && (
                        <Button type="noBorder" onClick={backProps.onClick}>
                            {t('tour.back')}
                        </Button>
                    )}
                    <Button typeColor="green" onClick={primaryProps.onClick}>
                        {isLastStep ? t('tour.done') : t('tour.next')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TourTooltip;
