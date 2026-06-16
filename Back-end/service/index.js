module.exports = {
    authService: require('./auth.service'),
    avatarService: require('./avatar.service'),
    emailService: require('./email.service'),
    fileService: require('./file.service'),
    scheduleService: require('./schedule'),
    messageService: require('./assistant/message.service'),
    sessionService: require('./assistant/session.service'),
    groqService: require('./assistant/groq-service'),
    uploadService: require('./upload.service'),
    userService: require('./user.service'),
    verificateService: require('./verificate.service')
};
