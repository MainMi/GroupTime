// Localized reminder message builders, looked up by resolveLanguage(lang).
// Returns { subject, emailSubtitle, telegramText }.
const build = (lang, {
    name, time, place, offset,
}) => {
    const where = place ? `, ${place}` : '';
    if (lang === 'en') {
        return {
            subject: `Reminder: ${name}`,
            emailSubtitle: `${name} starts at ${time}${where} — in ${offset} min.`,
            telegramText: `⏰ <b>${name}</b>\n${time}${where}\nStarts in ${offset} min.`,
        };
    }
    return {
        subject: `Нагадування: ${name}`,
        emailSubtitle: `«${name}» починається о ${time}${where} — за ${offset} хв.`,
        telegramText: `⏰ <b>${name}</b>\n${time}${where}\nПочаток за ${offset} хв.`,
    };
};

module.exports = { build };
