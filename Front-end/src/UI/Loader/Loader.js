import classes from './Loader.module.scss';
import logo from '../../static/image/globalcons/logo.svg';

const Loader = ({ inline = false }) => (
    <div className={`${classes.loader} ${inline ? classes.inline : ''}`}>
        <img src={logo} alt="loading" className={classes.icon} />
    </div>
);

export default Loader;
