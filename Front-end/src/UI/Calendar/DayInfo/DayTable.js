import React, { memo, useMemo } from 'react';
import classes from './DayTable.module.scss';

// Day-accurate comparison of two Dates (ignores time).
const sameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Компонент для відображення одного тижня
const DaysOfWeek = memo(({
    isGreen,
    selectedDay,
    currentWeek,
    maxDayOfMonth,
    prevMaxDayOfMonth,
    startDayOfWeek,
    changeDayHandler,
    range,
    rangeFrom,
    rangeTo,
    viewYear,
    viewMonth
}) => {
    const stepDayOfWeek = startDayOfWeek - 1;

    const minWeekValue = useMemo(() => {
        return currentWeek === 0 ? 1 : 1 + (currentWeek * 7) - stepDayOfWeek;
    }, [currentWeek, stepDayOfWeek]);

    const maxWeekValue = useMemo(() => {
        const calculatedMax = 7 + (currentWeek * 7) - stepDayOfWeek;
        return maxDayOfMonth < calculatedMax ? maxDayOfMonth : calculatedMax;
    }, [currentWeek, stepDayOfWeek, maxDayOfMonth]);

    const isSelectedWeek = useMemo(() => {
        return selectedDay >= minWeekValue && selectedDay <= maxWeekValue;
    }, [selectedDay, minWeekValue, maxWeekValue]);

    // In range mode we never highlight the whole week row.
    const weekClassName = useMemo(() => {
        return `${classes.weekTable} ${!range && isSelectedWeek ? classes.selected : ''} ${isGreen ? classes.green : ''}`;
    }, [range, isSelectedWeek, isGreen]);

    // Генерація днів тижня
    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            let currentDay = i + (currentWeek * 7) + 1 - stepDayOfWeek;
            let isDisabled = false;

            if (currentWeek === 0 && (i + 1) < startDayOfWeek) {
                currentDay = prevMaxDayOfMonth + (i - (stepDayOfWeek - 1));
                isDisabled = true;
            }

            if (currentWeek > 1 && currentDay > maxDayOfMonth) {
                currentDay -= maxDayOfMonth;
                isDisabled = true;
            }

            let isSelected;
            let isInRange = false;
            if (range) {
                // Compare against the real date of this cell (current month only).
                const cellDate = !isDisabled ? new Date(viewYear, viewMonth, currentDay) : null;
                const isEdge = sameDay(cellDate, rangeFrom) || sameDay(cellDate, rangeTo);
                isInRange = !!(cellDate && rangeFrom && rangeTo && cellDate > rangeFrom && cellDate < rangeTo);
                isSelected = isEdge;
            } else {
                isSelected = selectedDay === currentDay && isSelectedWeek;
            }
            const dayClassName = `${classes.day} ${isSelected ? classes.selected : ''} ${isInRange ? classes.inRange : ''} ${isDisabled ? classes.disabled : ''}`;

            // Використання useCallback для обробника кліку
            const handleClick = () => {
                if (!isDisabled) {
                    changeDayHandler(currentDay);
                }
            };

            return (
                <div
                    key={i}
                    className={dayClassName}
                    onClick={!isDisabled ? handleClick : undefined}
                >
                    {currentDay}
                </div>
            );
        });
    }, [currentWeek, stepDayOfWeek, startDayOfWeek, prevMaxDayOfMonth, maxDayOfMonth, selectedDay, isSelectedWeek, changeDayHandler, range, rangeFrom, rangeTo, viewYear, viewMonth]);

    return (
        <div className={weekClassName}>
            {days}
        </div>
    );
});

// Основний компонент таблиці днів
const DayTable = memo(({
    isGreen,
    maxDayOfMonth,
    prevMaxDayOfMonth,
    startDayOfWeek,
    currentDay: selectedDay,
    changeDayHandler,
    range = false,
    rangeFrom = null,
    rangeTo = null,
    viewYear,
    viewMonth
}) => {
    const adjustedStartDayOfWeek = useMemo(() => (startDayOfWeek === 0 ? 7 : startDayOfWeek), [startDayOfWeek]);

    const weeksLength = useMemo(() => {
        return Math.ceil((maxDayOfMonth + (adjustedStartDayOfWeek - 1)) / 7);
    }, [maxDayOfMonth, adjustedStartDayOfWeek]);

    // Генерація тижнів
    const weeks = useMemo(() => {
        return Array.from({ length: weeksLength }).map((_, i) => (
            <DaysOfWeek
                key={i}
                isGreen={isGreen}
                selectedDay={selectedDay}
                currentWeek={i}
                maxDayOfMonth={maxDayOfMonth}
                prevMaxDayOfMonth={prevMaxDayOfMonth}
                startDayOfWeek={adjustedStartDayOfWeek}
                changeDayHandler={changeDayHandler}
                range={range}
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                viewYear={viewYear}
                viewMonth={viewMonth}
            />
        ));
    }, [weeksLength, isGreen, selectedDay, maxDayOfMonth, prevMaxDayOfMonth, adjustedStartDayOfWeek, changeDayHandler, range, rangeFrom, rangeTo, viewYear, viewMonth]);

    const dayTableClassName = useMemo(() => {
        return `${classes.dayTable} ${isGreen ? classes.green : ''}`;
    }, [isGreen]);

    return (
        <div className={dayTableClassName}>
            {weeks}
        </div>
    );
});

export default DayTable;
