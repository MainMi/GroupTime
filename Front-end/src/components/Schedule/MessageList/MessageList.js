import classes from './MessageList.module.scss'
import logo from '../../../static/image/globalcons/logo.svg'
import messageEnum from '../../../constants/type/messageEnum';
import Markdown from '../../../UI/Markdown/Markdown';

const MessageList = ({ messages }) => {

    return <div className={classes.messageList}>
        {messages.map((vl) => {
            const isAi = vl.type === messageEnum.ASSISTANT_MSG_TYPE;
            return (
                <div className={`${classes.message} ${isAi ? classes.ai : ''}`} key={vl._id}>
                    <img className={classes.image} src={logo} alt='avatar' />
                    <div className={classes.messageBox}>
                        {/* AI replies can contain markdown (tables, bold); user text stays plain. */}
                        {isAi ? <Markdown>{vl.content}</Markdown> : vl.content}
                    </div>
                </div>
            );
        })}
    </div>
}
export default MessageList;