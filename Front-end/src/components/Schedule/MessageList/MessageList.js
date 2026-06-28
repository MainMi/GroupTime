import { useTranslation } from 'react-i18next';
import classes from './MessageList.module.scss'
import logo from '../../../static/image/globalcons/logo.svg'
import messageEnum from '../../../constants/type/messageEnum';
import Markdown from '../../../UI/Markdown/Markdown';
import Button from '../../../UI/Button/Button';

// Render a user message, bolding a leading slash command (e.g. "/magic …")
// even when the user didn't format it.
const renderUserContent = (text) => {
    const m = /^(\/[a-zA-Z]+)([\s\S]*)$/.exec(text || '');
    if (!m) return text;
    return <><strong>{m[1]}</strong>{m[2]}</>;
};

const MessageList = ({ messages, userAvatar, onConfirmAction, onCancelAction }) => {
    const { t } = useTranslation();

    return <div className={classes.messageList}>
        {messages.map((vl) => {
            const isAi = vl.type === messageEnum.ASSISTANT_MSG_TYPE;
            return (
                <div className={`${classes.message} ${isAi ? classes.ai : ''}`} key={vl._id}>
                    <img className={classes.image} src={isAi ? logo : (userAvatar || logo)} alt='avatar' />
                    <div className={classes.messageBox}>
                        {/* AI replies can contain markdown (tables, bold); user text stays plain. */}
                        {isAi ? <Markdown>{vl.content}</Markdown> : renderUserContent(vl.content)}

                        {/* "/magic", "/organizer" and analysis fixes: one confirmable card per
                            proposed action, each applied or discarded independently. */}
                        {Array.isArray(vl.actions) && vl.actions.map((action, idx) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div className={classes.actionCard} key={idx}>
                                {action.summary && (
                                    <p className={classes.actionSummary}>{action.summary}</p>
                                )}
                                {action.status === 'done' && (
                                    <span className={classes.actionStatus}>{t('assistant.actionDone')}</span>
                                )}
                                {action.status === 'cancelled' && (
                                    <span className={classes.actionStatus}>{t('assistant.magicCancelled')}</span>
                                )}
                                {!action.status && (
                                    <div className={classes.actionButtons}>
                                        <Button typeColor="green" onClick={() => onConfirmAction?.(vl, idx)}>
                                            {t('common.confirm')}
                                        </Button>
                                        <Button typeColor="noBorder" onClick={() => onCancelAction?.(vl, idx)}>
                                            {t('common.cancel')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
    </div>
}
export default MessageList;
