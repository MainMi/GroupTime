// All user-facing assistant text lives here so no localized strings are hardcoded
// in the controller/service/helper layers. Each entry is a { uk, en } pair whose
// value is either a string or a builder function. Code picks the variant with
// helper/lang.isUk; it never embeds the wording itself.
module.exports = {
    // Note appended when some requested actions were dropped for lack of rights.
    permissionSkip: {
        uk: (names) => `Деякі дії пропущено: у вас немає прав керувати розкладом групи ${names}.`,
        en: (names) => `Some actions were skipped: you don't have permission to manage the schedule for ${names}.`,
    },
    // Confirmation summary for a single tag-only edit proposed by /organize.
    organizeTagSummary: {
        uk: (tags, name, groupName) => `Додати теги [${tags}] до «${name}» (${groupName}). Підтвердити?`,
        en: (tags, name, groupName) => `Add tags [${tags}] to "${name}" (${groupName}). Confirm?`,
    },
    // Fallback reply when /organize produced at least one proposal.
    organizeIntro: {
        uk: 'Пропоную такі теги. Підтвердьте кожну зміну нижче.',
        en: 'Suggested tags below — confirm each change.',
    },
    // Fallback reply when /organize found nothing to tag.
    organizeNoTags: {
        uk: 'Не знайшов подій, яким варто додати теги.',
        en: "I didn't find events that need tags.",
    },
    // Field labels for the /magic "what's still missing" follow-up, by language.
    fieldLabels: {
        uk: {
            name: 'назву', time: 'час (ГГ:ХХ)', day: 'день тижня', date: 'дату'
        },
        en: {
            name: 'a name', time: 'time (HH:MM)', day: 'a day of week', date: 'a date'
        },
    },
};
