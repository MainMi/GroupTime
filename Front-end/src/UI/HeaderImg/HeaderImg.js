import classes from './HeaderImg.module.scss'
const HeaderImg = (props) => {
    return <div className={`${props.className} ${classes.headerImg}`} style={{...props}}></div>
}

export default HeaderImg;