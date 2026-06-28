// Localized full day names keyed by weekEnum day code. Kept separate from
// week.enum.js so that Object.values(weekEnum) stays the plain list of day codes.
module.exports = {
    // Ukrainian, capitalized — for prompt output.
    DAY_NAMES_UK: {
        Пн: 'Понеділок',
        Вв: 'Вівторок',
        Ср: 'Середа',
        Чт: 'Четвер',
        Пт: "П'ятниця",
        Сб: 'Субота',
        Вс: 'Неділя',
    },
    // By language, lowercase — for inline confirmation/summary text.
    DAY_NAMES_LONG: {
        uk: {
            Пн: 'понеділок',
            Вв: 'вівторок',
            Ср: 'середа',
            Чт: 'четвер',
            Пт: "п'ятниця",
            Сб: 'субота',
            Вс: 'неділя',
        },
        en: {
            Пн: 'Monday',
            Вв: 'Tuesday',
            Ср: 'Wednesday',
            Чт: 'Thursday',
            Пт: 'Friday',
            Сб: 'Saturday',
            Вс: 'Sunday',
        },
    },
};
