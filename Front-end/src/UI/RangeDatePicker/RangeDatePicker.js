import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classes from './RangeDatePicker.module.scss';
import Input from '../Input/Input';
import Calendar from '../Calendar/Calendar';
import calendarEnum from '../../constants/calendarEnum';

// A read-only picker that shows a "from – to" range and opens a Calendar in
// range mode. Mirrors DatePicker but emits { from, to } Dates via onChange.
const RangeDatePicker = ({
    placeholder = 'Select range',
    from = null,
    to = null,
    onChange,
}) => {
    const toDate = useCallback((value) => {
        if (value instanceof Date) return isNaN(value) ? null : value;
        if (value) {
            const d = new Date(value);
            return isNaN(d) ? null : d;
        }
        return null;
    }, []);

    const fromDate = useMemo(() => toDate(from), [from, toDate]);
    const toDateVal = useMemo(() => toDate(to), [to, toDate]);

    const display = useMemo(() => {
        const opts = { year: 'numeric', month: 'long', day: 'numeric' };
        const f = fromDate ? fromDate.toLocaleDateString(undefined, opts) : '';
        const tt = toDateVal ? toDateVal.toLocaleDateString(undefined, opts) : '';
        if (f && tt) return `${f} – ${tt}`;
        return f || tt;
    }, [fromDate, toDateVal]);

    const [isModal, setIsModal] = useState(false);
    const containerRef = useRef(null);

    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; });

    // Close the calendar when clicking outside it.
    useEffect(() => {
        if (!isModal) return undefined;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsModal(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isModal]);

    const clickModalHandler = useCallback((ev) => {
        ev.preventDefault();
        setIsModal((prev) => !prev);
    }, []);

    const changeRangeHandler = useCallback((range) => {
        if (onChangeRef.current) onChangeRef.current(range);
        setIsModal(false);
    }, []);

    return (
        <div ref={containerRef} className={classes.rangeDatePicker}>
            <Input value={display} placeholder={placeholder} readOnly={true} onClick={clickModalHandler} />
            {isModal && (
                <div className={classes.modal}>
                    <Calendar
                        color="green"
                        range
                        rangeStart={fromDate}
                        rangeEnd={toDateVal}
                        currentDate={fromDate || new Date()}
                        maxYear={calendarEnum.currentYear + 3}
                        resultFn={changeRangeHandler}
                    />
                </div>
            )}
        </div>
    );
};

export default RangeDatePicker;
