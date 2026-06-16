const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates');
const path = require('path');

const { NO_REPLY_EMAIL, NO_REPLY_EMAIL_PASS } = require('../config/config');
const emailDataTemplate = require('../view/data/emailDataTemplate');

const ApiError = require('../error/ErrorHandler');
const { TEMPLATE_IS_NOT_FOUND } = require('../error/errorMsg');

const sendMail = async (receiverEmail, emailType, context = {}) => {
    const templateParser = new EmailTemplate({
        views: {
            root: path.join(global.rootPath, 'view', 'page'),
        }
    });
    const templateInfo = emailDataTemplate[emailType];

    if (!templateInfo) {
        throw new ApiError(...Object.values(TEMPLATE_IS_NOT_FOUND));
    }

    const { renderType, subject } = templateInfo;
    // Build a fresh per-send data object — never mutate the shared template,
    // otherwise one send's context (userInfo/groupInfo/hrefs) leaks into the next.
    const data = { ...templateInfo.data, ...context };

    const html = await templateParser.render(renderType, data);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: NO_REPLY_EMAIL,
            pass: NO_REPLY_EMAIL_PASS,
        }
    });
    return transporter.sendMail({
        from: 'No reply test',
        to: receiverEmail,
        subject,
        html
    });
};

module.exports = {
    sendMail
};
