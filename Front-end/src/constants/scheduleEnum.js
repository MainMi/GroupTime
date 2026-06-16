// Day-of-week options for static event selectors
export const DAYS = [
    { title: 'Понеділок', value: '1' },
    { title: 'Вівторок', value: '2' },
    { title: 'Середа',   value: '3' },
    { title: 'Четвер',   value: '4' },
    { title: "П'ятниця", value: '5' },
    { title: 'Субота',   value: '6' },
    { title: 'Неділя',   value: '0' },
];

// Backend weekEnum values → JS Date.getDay() value
export const BACKEND_DAY_TO_JSDAY = {
    'Пн': 1,
    'Вв': 2,
    'Ср': 3,
    'Чт': 4,
    'Пт': 5,
    'Сб': 6,
    'Вс': 0,
};

// Backend weekEnum day values in Monday→Sunday order (for rendering the grid)
export const ORDERED_BACKEND_DAYS = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// JS Date.getDay() value → DAYS array index (for Dropdown defaultIndex)
export const JSDAY_TO_DAYS_INDEX = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    0: 6,
};
