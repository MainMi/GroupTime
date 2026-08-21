import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import classes from './Dropdown.module.scss';
import Checkbox from '../Checkbox/Checkbox';
import PropTypes from 'prop-types';
import { capitalizeText } from '../../helper/textHelper';

const ListElements = React.memo(({ arrValue, clickElementHandler }) => (
    <ul className={classes.list}>
        {arrValue.map((item, idx) => (
            <li
                key={item.value + idx}
                onClick={() => clickElementHandler(item)}
                className={classes.listItem}
            >
                {item.title}
            </li>
        ))}
    </ul>
));

const CheckBoxListElements = React.memo(({ arrValue, clickElementHandler }) => (
    <div className={classes.list}>
        {arrValue.map((item, index) => (
            <Checkbox
                key={item.value}
                checked={item.checked}
                onChange={(ev) => clickElementHandler(ev, index)}
                labelClassName={classes.checkboxItem}
            >
                {item.title}
            </Checkbox>
        ))}
    </div>
));

const Dropdown = ({
    label = 'Select',
    type = 'default',
    color = 'pink',
    changeValueHandler = () => {},
    arrValue = [],
    defaultIndex = null,
    id,
    error = '',
    size = 14,
    borderRadius = 15,
    classNameButton = '',
    resetFn,
    ...otherProps
}) => {
    
    
    const values = useMemo(() => {
        return arrValue.map((vl, idx) => {
            if (type === 'checkbox') {
                return {
                    title: vl.title || capitalizeText(vl),
                    value: vl.value || vl.toLowerCase(),
                    checked: vl.checked || false,
                };
            }
            else if (type === 'index') {
                return { title: vl.title || vl, value: vl.value || idx };
            }
            return { title: vl.title || capitalizeText(vl), value: vl.value || vl.toLowerCase() };
        });
    }, [arrValue, type]);
    
    const isCheckbox = type === 'checkbox';
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close the menu when clicking anywhere outside it, so an open dropdown can't
    // keep overlaying (and intercepting clicks meant for) the controls below it.
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    const [selectedTitle, setSelectedTitle] = useState(() => {
        if (defaultIndex !== null && values[defaultIndex]) {
            return values[defaultIndex].title;
        }
        return label;
    });
    const [selectedValue, setSelectedValue] = useState(() => {
        if (defaultIndex !== null && values[defaultIndex]) {
            return values[defaultIndex].value;
        }
        return '';
    });

    const [currentValues, setCurrentValues] = useState(() => {
        if (isCheckbox) {
            return values;
        }
        return [];
    });

    useEffect(() => {
        if (resetFn) {
            resetFn(() => {
                setSelectedTitle(() => {
                    if (defaultIndex !== null && values[defaultIndex]) {
                        return values[defaultIndex].title;
                    }
                    return label;
                })
                setSelectedValue(() => {
                    if (defaultIndex !== null && values[defaultIndex]) {
                        return values[defaultIndex].value;
                    }
                    return '';
                })
                setIsOpen(false)
            });
        }
    }, [resetFn]);

    const changeValueHandlerRef = useRef(changeValueHandler);
    changeValueHandlerRef.current = changeValueHandler;

    useEffect(() => {
        changeValueHandlerRef.current(selectedValue);
    }, [selectedValue]);

    const toggleDropdown = useCallback(() => {
        setIsOpen((prevIsOpen) => !prevIsOpen);
    }, []);

    const selectElement = useCallback((item) => {
        setSelectedTitle(item.title);
        setSelectedValue(item.value);
        setIsOpen(false);
    }, []);

    const toggleCheckbox = useCallback(
        (ev, index) => {
            setCurrentValues((prevValues) => {
                const updatedValues = prevValues.map((item, idx) =>
                    idx === index ? { ...item, checked: ev.target.checked } : item
                );
    
                const checkedArr = updatedValues.filter(item => item.checked);
                const checkedCount = checkedArr.length;
    
                let checkedTitles = ''
                let checkedValue = []
                for (let i = 0; i < checkedCount; i++) {
                    checkedTitles += checkedArr[i].title;
                    if (i !== checkedCount - 1) {
                        checkedTitles += ', ';
                    }
                    checkedValue.push(checkedArr[i].value);
                }
                if (checkedCount > 2) {
                    checkedTitles = `${checkedCount} Selected`;
                }
                setSelectedValue(checkedValue);
                setSelectedTitle(checkedTitles || label);
    
                return updatedValues;
            });
        },
        [label]
    );

    const classLabelBox = `${classes.labelBox} ${isOpen ? classes.active : ''}`;
    const newClassNameButton = `${classes.dropdown} ${
        color === 'green' ? classes.green : ''
    } ${error ? classes.error : ''} ${isOpen ? classes.active : ''}
    ${selectedTitle === label ? classes.placeholder : ''} ${selectedValue.length !== 0 ? classes.selected: ''} ${classNameButton}`;
    
    const classNameList = `${classes.dropdownList} ${isOpen ? classes.active : ''}`;

    const styleSize = { fontSize: `${size}px` };
    const inputStyle = { ...styleSize, borderRadius, height: `${size + 18}px` };

    return (
        <div ref={containerRef} className={classLabelBox} aria-haspopup="listbox" aria-expanded={isOpen}>
            <button
                id={id}
                style={inputStyle}
                className={newClassNameButton}
                {...otherProps}
                onClick={toggleDropdown}
                type="button"
            >
                {selectedTitle}
            </button>
            {isOpen && (
                <div className={classNameList} role="listbox">
                    {isCheckbox ? (
                        <CheckBoxListElements
                            arrValue={currentValues}
                            clickElementHandler={toggleCheckbox}
                        />
                    ) : (
                        <ListElements
                            arrValue={values}
                            clickElementHandler={selectElement}
                        />
                    )}
                </div>
            )}
            {error && <div className={classes.error}>{error}</div>}
        </div>
    );
};

Dropdown.propTypes = {
    label: PropTypes.string,
    type: PropTypes.oneOf(['default', 'checkbox']),
    color: PropTypes.string,
    arrValue: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            value: PropTypes.string,
            checked: PropTypes.bool,
        })
    ),
    defaultIndex: PropTypes.number, // Додаємо PropType для defaultIndex
    id: PropTypes.string,
    error: PropTypes.string,
    size: PropTypes.number,
    borderRadius: PropTypes.number,
};

export default Dropdown;
