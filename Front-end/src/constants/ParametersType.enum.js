import Checkbox from "../UI/Checkbox/Checkbox";
import Dropdown from "../UI/Dropdown/Dropdown";
import Input from "../UI/Input/Input";
import roleEnum from "./roleEnum";

const renderType = {
    number: (value, ...otherProps) => <Input
        placeholder={value}
        {...otherProps}
    />,
    dropdown: (value, options, ...otherProps) => <Dropdown
        defaultIndex={value.indexOf(value)}
        arrValue={Object.values(options)}
        {...otherProps}
    />,
    boolean: (value, ...otherProps) => <Checkbox
        defaultChecked={value}
        {...otherProps}
    />
}

const parametersType = {
    usersLimit: (value, ...otherProps) => renderType.number(value, ...otherProps),
    createEventInfosRole: (value, ...otherProps) => renderType.dropdown(value, roleEnum, ...otherProps),
    notifacionFromEmail: (value, ...otherProps) => renderType.boolean(value, roleEnum, ...otherProps)
};

export default parametersType;