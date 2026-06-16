import { useState } from 'react';
import classes from './Input.module.scss'
import openEyes from '../../static/image/inputIcons/openEyes.svg'
import closeEyes from '../../static/image/inputIcons/closeEyes.svg'

const Input = ({
    label = false,
    placeholder = '',
    id = label || '',
    error = '',
    size = 14,
    type = 'text',
    style,
    labelClassName = '',
    labelBoxClassName = '',
    inputClassName = '', 
    ...otherProps
}) => {


    const className = `${classes.input} ${error ? classes.error : ''}`
    const styleSize = { fontSize: `${size}px`};
    const inputSize = { ...styleSize, height: `${size + 18}px`, ...style};

    const [ typeInput, setTypeInput ] = useState(type);
    const isPassword = typeInput === 'password';

    const onHiddenText = () => setTypeInput(isPassword ? type : 'password');

    return <div className={`${classes.labelBox} ${!label ? classes.only : ''} ${labelBoxClassName}`}>
        {label && <label htmlFor={id} style={styleSize} className={labelClassName}>{label}</label>}
        <input
            id={id}
            placeholder={placeholder}
            type={typeInput}
            className={`${className} ${inputClassName}`}
            style={inputSize}
            {...otherProps}
        >
        </input>
        {type === 'password' && <img src={ isPassword ? openEyes : closeEyes } onClick={onHiddenText} alt='c'></img>}
        {!!error && <div className={classes.error}>{error}</div>}
    </div>
}

export default Input;