import classes from './AvatarImg.module.scss'

import logoPinkImg from '../../static/image/globalcons/logo-pink.svg'
import { basicAvatarIconsArr } from '../../static/image/avatarIcons';
import { generateRandomNumber } from '../../helper/randomHelper';

const sizes = {
    small: {
        width: '54px',
        height: '54px'
    },
    medium: {
        width: '120px',
        height: '120px'
    },
    large: {
        width: '160px',
        height: '160px'
    },
    'ex-large': {
        width: '320px',
        height: '320px'
    }
}

const AvatarImg = (props) => {
    const { size = 'small', src = null, className, randomImg = false } = props;
    const resSize = sizes?.[size]
        ? sizes[size]
        : {
            width: `${size}px`,
            height: `${size}px`
        }
    const randomImgSrc = basicAvatarIconsArr[generateRandomNumber(0, basicAvatarIconsArr.length - 1)];
    const imgSrc = randomImg ? randomImgSrc : src;
    const isDefImg = src === null && !randomImg;
    const currentClassName = `${classes.imgBox} ${className}`;
    return <div style={resSize} className={currentClassName}>
        <img src={isDefImg ? logoPinkImg : imgSrc} className={isDefImg ? classes.logo : ''} alt="avatar" />
    </div>
}

export default AvatarImg;