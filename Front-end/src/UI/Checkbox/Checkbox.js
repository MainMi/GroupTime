import classes from './Checkbox.module.scss'

const  Checkbox = ({
    value,
    typeColor,
    labelClassName = '', 
    size = 22,
    error = false,
    readOnly = false,
    children,
    onChange = () => {},
    ...otherParameters
}) => {

    const inputClassName = `${classes.checkBox} ${typeColor === 'green' ? classes.green : ''} ${error ? classes.error : ''}`;
    const labelClassname = `${classes.labelBox} ${labelClassName}`;

    return <label className={labelClassname}>
        <input type="checkbox" className={inputClassName} onChange={onChange} checked={value} {...otherParameters } />
        <span>{children}</span>
    </label>
        
}

export default Checkbox;