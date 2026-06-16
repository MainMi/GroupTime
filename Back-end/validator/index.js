module.exports = {
    authValidator: require('./auth.validator'),
    createUserValidator: require('./createUser.validator'),
    updateUserValidator: require('./updateUser.validator'),
    emailValidator: require('./email.validator'),
    groupValidator: require('./group.validator'),
    messageValidator: require('./message.validator'),
    messageAnalyzeValidator: require('./messageAnalyze.validator'),
    weekValidator: require('./schedule/week.validator'),
    eventValidator: require('./schedule/event.vaidator'),
};
