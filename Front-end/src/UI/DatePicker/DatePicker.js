import classes from './DatePicker.module.scss'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Input from "../Input/Input";
import Calendar from "../Calendar/Calendar";


const DateModal = ({ resultFn, currentDate, isTime }) => {
    return <div className={classes.modal}>
        <Calendar color="green" currentDate={currentDate} isTime={isTime} resultFn={resultFn}/>
    </div>
}

const DatePicker = ({
    placeholder = 'Select date',
    isTime = false,
    value = null,
    onChange,
}) => {

    const formatDateTime = useCallback((date, withTime = false) => {

        if (!(date instanceof Date) || isNaN(date)) return '';

        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(undefined, dateOptions);

        if (withTime) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;
            return `${formattedDate} ${formattedTime}`;
        }

        return formattedDate;
    }, []);

    // Normalise the controlled value into a real Date (or null).
    const valueDate = useMemo(() => {
        if (value instanceof Date) return isNaN(value) ? null : value;
        if (value) {
            const d = new Date(value);
            return isNaN(d) ? null : d;
        }
        return null;
    }, [value]);

    const display = useMemo(
        () => formatDateTime(valueDate, isTime),
        [valueDate, isTime, formatDateTime]
    );

    const [isModal, setIsModal] = useState(false);

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });

    const clickModalHandler = useCallback((ev) => {
        ev.preventDefault();
        setIsModal((prevState) => !prevState);
    }, []);

    const changeDateHandler = useCallback((newDate) => {
        if (onChangeRef.current) onChangeRef.current(newDate);
        setIsModal(false);
    }, []);


    return <div className={classes.datePicker}>
        <Input value={display} placeholder={placeholder} readOnly={true} onClick={clickModalHandler}/>
        {isModal && (
            <DateModal
                currentDate={valueDate || new Date()}
                isTime={isTime}
                resultFn={changeDateHandler}
            />
        )}
    </div>
}

export default DatePicker;
