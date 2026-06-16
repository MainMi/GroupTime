import React, { useState, useRef, useEffect, useCallback } from 'react';
import classes from './SearchDropdown.module.scss';
import buttonsImages from '../../static/image/buttonIcons';

const SearchableDropdown = ({
    options = [],
    placeholder,
    selectedVal,
    setVal,
    filterFn,
    isUserFind = false,
    handleChange,
    resetFn
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    
    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (setVal) {
            setQuery(setVal);
            inputRef.current.value = setVal;
            
        }
    }, [setVal])

    useEffect(() => {
        if (resetFn && !setVal) {
            
            resetFn(() => {
                setQuery('')
                setIsOpen(false)
            });
        }
    }, [resetFn]);

    useEffect(() => {
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [options]);

    const selectOption = useCallback((option, isUserFind) => {
        setQuery(!isUserFind ? option.title : option.fullName);
        handleChange(!isUserFind ? option.value : option, query);
        setIsOpen(false);
    }, [handleChange]);

    const toggle = useCallback((e) => {
        setIsOpen(e && e.target === inputRef.current);
    }, []);

    const isOpenClassName = isOpen ? classes.isOpen : '';
    const selectedValClassName = selectedVal ? classes.selected : '';

    return (
        <div ref={dropdownRef} className={classes.dropdownContainer}>
            <div className={classes.dropdownBox}>
                <input
                    ref={inputRef}
                    value={query}
                    type="text"
                    placeholder={placeholder}
                    name="searchTerm"
                    onChange={(e) => {
                        setQuery(e.target.value)
                        handleChange('', e.target.value);
                    }}
                    onClick={toggle}
                    className={`${classes.dropdownInput} ${classes.arrowOpen} ${isOpenClassName}`}
                />
                <img src={buttonsImages['chevron-bottom-pink']} alt="arrow" className={`${classes.dropdownArrow} ${isOpenClassName}`} />
            </div>
            {isOpen && (
                <div className={`${classes.options} ${isOpenClassName}`}>
                    {!isUserFind ?
                        options.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => selectOption(option)}
                                className={`${classes.option} ${selectedValClassName}`}
                            >
                                {option.title}
                            </div>
                        ))
                        : options.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => selectOption(option, isUserFind)}
                                className={`${classes.option} ${selectedValClassName}`}
                            >
                                <div className={classes.userInfo}>
                                    <h6>{option.fullName}</h6>
                                    <span>@{option.nickname}</span>
                                </div>
                                <div className={classes.groupCount}>
                                    <img src={buttonsImages.groups} alt='groups'></img>
                                    {option.groupCount}/5
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
};



export default SearchableDropdown;
