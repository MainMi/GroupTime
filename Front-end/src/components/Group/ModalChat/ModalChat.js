import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import classes from './ModalChat.module.scss';
import buttonsImages from '../../../static/image/buttonIcons';
import Input from '../../../UI/Input/Input';
import Button from '../../../UI/Button/Button';
import Modal from '../../../UI/Modal/Modal';
import useInput from '../../../hooks/useInput';
import validateFn from '../../../constants/validateFn.enum';
import MessageList from '../../Schedule/MessageList/MessageList';
import messageEnum from '../../../constants/type/messageEnum';
import { buildMessagesKey } from '../../../constants/storageKeys';
import { getStorageJSON, setStorageJSON } from '../../../helper/storageHelper';

const ModalChat = ({ modalClose, connectUserId, isGroup }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [messagesConnect, setMessagesConnect] = useState([]);

    let {
        value: valueMessage,
        isValidInput: isValidMessage,
        valueChangeHandler: messageChangeHandler,
        inputBlurHandler: messageBlurHandler,
        resetFn: resetMessage,
    } = useInput(validateFn.isNotEmptyFn, 'Message');

    const userInfo = useSelector((state) => state.auth.userInfo);

    useEffect(() => {
        const savedMessages = getStorageJSON(buildMessagesKey(userInfo._id, connectUserId), []);
        const savedMessagesConnectUser = getStorageJSON(buildMessagesKey(connectUserId, userInfo._id), []);
        setMessages(savedMessages);
        setMessagesConnect(savedMessagesConnectUser)
    }, []);

    const handleSendMessage = async () => {
        if (!isValidMessage) {
            return;
        }
        const newMessage = { userId: userInfo._id, content: valueMessage, timestamp: new Date().toISOString() };
        const userAnswer = { userId: userInfo._id, content: valueMessage, timestamp: new Date().toISOString(), type: messageEnum.ASSISTANT_MSG_TYPE };
        
        if (isGroup) {
            setStorageJSON(buildMessagesKey(connectUserId), [...messages, userAnswer]);
        } else {
            setStorageJSON(buildMessagesKey(userInfo._id, connectUserId), [...messages, newMessage]);
            setStorageJSON(buildMessagesKey(connectUserId, userInfo._id), [...messagesConnect, userAnswer]);
        }
        
        setMessages([...messages, newMessage]);
        resetMessage();
    };
    

    return (
        <Modal onHiddenCart={modalClose}>
            <div className={classes.modalContent}>
                <div className={classes.titleBox}>
                    <h4>{t('common.chat')}</h4>
                    <img src={buttonsImages['close-pink']} alt='close-pink' onClick={modalClose} />
                </div>
                {!!messages?.length && <MessageList messages={messages} />}
                <div className={classes.buttonBox}>
                    <Input
                        value={valueMessage}
                        onChange={messageChangeHandler}
                        onBlur={messageBlurHandler}
                    />
                    <Button
                        typeColor='green'
                        onClick={handleSendMessage}
                        disabled={!isValidMessage}
                    >{t('common.send')}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModalChat;