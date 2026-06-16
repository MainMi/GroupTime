import classes from './Modal.module.scss';
import ReactDOM from 'react-dom'

const Backdrop = (props) => {
    return <div className={classes.backdrop} onClick={props.onHiddenCart}></div>
}

const ModalOverlays = (props) => {
    return <div className={`${classes.modal} ${props.classname}`} style={{...props.otherStyles}}>
            {props.children}
        </div>
}
const overlays = document.getElementById('overlays');
const Modal = ({
    children,
    onHiddenCart,
    modalClassname,
    ...otherStyles
}) => {
    return <>
        {ReactDOM.createPortal(<div className={classes.content}>
            <ModalOverlays classname={modalClassname} {...otherStyles}>{children}</ModalOverlays>
            <Backdrop onHiddenCart={onHiddenCart}/>
        </div>, overlays)}
    </>
        
}
export default Modal;