import classes from './ButtonNavigation.module.scss'
import buttonsImage from '../../static/image/buttonIcons/'

const ButtonNavigation = (props) => {
    let {
        backgroundColor = 'pink',
        imgColor,
        size = 16,
        centerImg = false,
        ...otherStyles
    } = props;
    const typesColors = [
        'white',
        'pink',
        'green'
    ]
    backgroundColor = typesColors.includes(backgroundColor) ? backgroundColor : 'pink';
    imgColor = typesColors.includes(imgColor) ? imgColor : backgroundColor;
    if (centerImg) {
        const keyColor = imgColor !== 'white' && centerImg in buttonsImage ? `${centerImg}-${imgColor}` : centerImg;
        centerImg = centerImg in buttonsImage ? buttonsImage[keyColor] : centerImg
    }
    
    const className = `${classes.buttonNavigation} ${backgroundColor !== 'white' ? classes[backgroundColor] : ''}`;

    const imgSizeStyle = { width: `${size}px`, height: `${size}px`};

    return <button className={className} style={{ fontSize: `${size}px`, ...otherStyles}}>
        {centerImg && <img src={centerImg} style={imgSizeStyle} alt='cImg'/>}
    </button>
}

export default ButtonNavigation;