<<<<<<< HEAD
const { DAY_NAMES_UK } = require('../constant/week.text');
const { languageRule, INTERNAL_RULES } = require('../constant/promptText');

const dayName = (code) => DAY_NAMES_UK[code] || code;
=======
const DAY_NAMES = {
    Пн: 'Понеділок',
    Вв: 'Вівторок',
    Ср: 'Середа',
    Чт: 'Четвер',
    Пт: "П'ятниця",
    Сб: 'Субота',
    Вс: 'Неділя',
};

const dayName = (code) => DAY_NAMES[code] || code;
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3

function formatDayEvents(dayObj) {
    if (!dayObj.events?.length) return null;
    const lines = [`${dayName(dayObj.day)}:`];
    for (const ev of dayObj.events) {
        if (!ev.eventInfo || !ev.eventDate) continue;
        const {
            name, teacherName, place, platform, link
        } = ev.eventInfo;
        const { time, duration } = ev.eventDate;
        let line = `  • ${time} (${duration} хв) — ${name}`;
        if (teacherName) line += `, вик.: ${teacherName}`;
        if (place) line += `, ${place}`;
        if (platform) line += ` (${platform})`;
        if (link) line += ` — ${link}`;
        lines.push(line);
    }
    return lines.length > 1 ? lines.join('\n') : null;
}

function formatSchedule(weekData) {
    const lines = [];

    if (weekData?.staticWeek?.length) {
        lines.push('Регулярний розклад (статичний):');
        for (const day of weekData.staticWeek) {
            const formatted = formatDayEvents(day);
            if (formatted) lines.push(formatted);
        }
        if (lines.length === 1) lines.push('  (немає подій)');
    }

    if (weekData?.dynamicWeek?.length) {
        lines.push('\nОдноразові заняття цього тижня:');
        for (const day of weekData.dynamicWeek) {
            const formatted = formatDayEvents(day);
            if (formatted) lines.push(formatted);
        }
    }

    return lines.length ? lines.join('\n') : 'Немає подій цього тижня.';
}

// Build the schedule section for one or several groups. Accepts the new
// `data.groups` array ([{ name, weekData }]) and falls back to the legacy
// single-group `{ group, currentWeek }` shape for backward compatibility.
function formatGroupsSchedule(data) {
    const groups = Array.isArray(data.groups) && data.groups.length
        ? data.groups
        : [{ name: data.group?.name, weekData: data.currentWeek }];

    if (groups.length === 1) {
        return formatSchedule(groups[0].weekData);
    }

<<<<<<< HEAD
    // Chat context labels groups as `groupName`, the /magic context as `name` —
    // accept either so multi-group headers never collapse to «—».
    return groups
        .map((g) => `=== Група «${g.name || g.groupName || '—'}» ===\n${formatSchedule(g.weekData)}`)
=======
    return groups
        .map((g) => `=== Група «${g.name || '—'}» ===\n${formatSchedule(g.weekData)}`)
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
        .join('\n\n');
}

// Turn structured analyzer issues into a plain-text Ukrainian summary the model
// can rephrase. The list itself is the source of truth.
function issuesToText(issues) {
    if (!issues?.length) return 'Проблем не виявлено.';

    const fieldUa = { teacher: 'викладач', place: 'місце', link: 'посилання/платформа' };

    return issues.map((it) => {
        const where = `${dayName(it.day)}${it.groupName ? ` (${it.groupName})` : ''}`;
        switch (it.type) {
<<<<<<< HEAD
            case 'overlap': {
                const fix = it.suggestion?.newTime
                    ? ` Можна перенести «${it.suggestion.event}» на ${it.suggestion.newTime}.`
                    : '';
                return `- Накладання у ${where}: «${it.events[0]}» (${it.meta?.firstTime}) і «${it.events[1]}» (${it.meta?.secondTime}) перетинаються за часом.${fix}`;
            }
=======
            case 'overlap':
                return `- Накладання у ${where}: «${it.events[0]}» (${it.meta?.firstTime}) і «${it.events[1]}» (${it.meta?.secondTime}) перетинаються за часом.`;
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
            case 'gap':
                return `- Велике вікно у ${where}: ${it.meta?.minutes} хв між «${it.events[0]}» і «${it.events[1]}».`;
            case 'overload':
                return `- Перевантажений день ${where}: ${it.meta?.count} подій.`;
            case 'duplicate':
                return `- Дублікат у ${where}: «${it.events[0]}» повторюється ${it.meta?.count} раз(и).`;
            case 'missing': {
                const f = (it.meta?.fields || []).map((x) => fieldUa[x] || x).join(', ');
                return `- Бракує даних у ${where}: «${it.events[0]}» — відсутні: ${f}.`;
            }
            default:
                return `- ${it.type} у ${where}.`;
        }
    }).join('\n');
}

<<<<<<< HEAD
function formatHistory(history) {
    if (!Array.isArray(history) || !history.length) return '';
    const lines = history
        .filter((m) => m && m.content)
        .map((m) => `${m.role === 'assistant' ? 'Асистент' : 'Користувач'}: ${m.content}`);
    return lines.length ? `\nПопередня розмова:\n${lines.join('\n')}\n` : '';
}

=======
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
function nowContext() {
    const now = new Date();
    return {
        dayName: now.toLocaleDateString('uk-UA', { weekday: 'long' }),
        dateStr: now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }),
        timeStr: now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    };
}

module.exports = {
<<<<<<< HEAD
=======
    DAY_NAMES,
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
    issuesToText,

    questionWithData: (question, data = {}) => {
        const { dayName: dn, dateStr, timeStr } = nowContext();
        const scheduleText = formatGroupsSchedule(data);
        const dayFilter = data.selectedDay ? `\nКористувача цікавить день: ${dayName(data.selectedDay)}.` : '';

<<<<<<< HEAD
        return `Ти — дружній AI-асистент для керуванням розкладу.

${languageRule(data.lang)}
=======
        return `Ти — дружній AI-асистент для університетського розкладу. Відповідай виключно українською мовою.
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3

Поточний час: ${dn}, ${dateStr}, ${timeStr}.

Про студента:
- Ім'я: ${data.user?.firstName || ''} ${data.user?.lastName || ''}

Розклад:
${scheduleText}${dayFilter}
<<<<<<< HEAD
${formatHistory(data.history)}
=======

>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
Питання: "${question}"

Інструкція:
- Відповідай конкретно, дружньо та коротко (1–4 речення).
- Якщо питання стосується розкладу — давай точну відповідь з часом, місцем, викладачем.
- Якщо подій кілька груп — уточнюй, про яку групу йдеться.
- Якщо питається про найближчу подію — визнач її на основі поточного часу і дня.
- Не переказуй структуру даних та не згадуй JSON.
<<<<<<< HEAD
- Якщо інформації немає — скажи чесно.
- Якщо користувач просить створити, відредагувати чи видалити подію — НЕ роби цього у звичайній відповіді. Чемно попроси повторити прохання, почавши його з команди «/magic» (наприклад: «/magic створи подію …»).
- Час від часу (не щоразу) доречно нагадати, що події створюються та редагуються командою «/magic».

${INTERNAL_RULES}`;
=======
- Якщо інформації немає — скажи чесно.`;
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
    },

    // Prompt for the "detect problems" feature: the deterministic analyzer found
    // the issues; the model only explains them in friendly Ukrainian.
    analysisPrompt: (issues, data = {}) => {
        const { dayName: dn, dateStr, timeStr } = nowContext();
        const issuesText = issuesToText(issues);

<<<<<<< HEAD
        return `Ти — AI-асистент для керуванням розкладу.

${languageRule(data.lang)}
=======
        return `Ти — AI-асистент для університетського розкладу. Відповідай виключно українською мовою.
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3

Поточний час: ${dn}, ${dateStr}, ${timeStr}.

Автоматичний аналіз розкладу${data.weekLabel ? ` (${data.weekLabel})` : ''} виявив такі моменти:
${issuesText}

Завдання:
- Якщо проблем немає — коротко підтвердь, що розклад виглядає добре.
- Інакше поясни знайдені проблеми простими словами, згрупуй за днями.
- Дай 1–2 практичні поради, як це виправити.
<<<<<<< HEAD
- Будь дружнім і лаконічним. Не вигадуй проблем, яких немає у списку.

${INTERNAL_RULES}`;
    },

    // Prompt for the "/magic" feature: turn a free-text create/edit request into a
    // STRICT JSON object the backend can validate and apply. The model only
    // extracts structure — it never invents data and leaves unknown fields null.
    magicPrompt: (message, data = {}) => {
        const { dayName: dn, dateStr, timeStr } = nowContext();
        const scheduleText = formatGroupsSchedule(data);
        const groupNames = (data.groups || []).map((g) => g.name).filter(Boolean);
        const groupsLine = groupNames.length
            ? groupNames.map((n) => `«${n}»`).join(', ')
            : '(немає доступних груп)';

        return `Ти — асистент, який перетворює прохання користувача на структуровану дію над розкладом (створення або редагування події). Поверни ВИКЛЮЧНО валідний JSON-об'єкт без жодного тексту до чи після нього.

${languageRule(data.lang)} (це стосується лише поля "reply").

Поточний час: ${dn}, ${dateStr}, ${timeStr}.
Коди днів тижня: Пн, Вв, Ср, Чт, Пт, Сб, Вс.
Доступні групи користувача: ${groupsLine}.

Поточний розклад (для пошуку події під час редагування):
${scheduleText}
${formatHistory(data.history)}
Враховуй контекст попередньої розмови вище: якщо користувач уточнює чи доповнює попереднє прохання (групу, назву події, час тощо) — поєднай це в одну дію.

Прохання користувача: "${message}"

Поверни JSON такої форми (масив "actions" — одна дія на КОЖНУ подію, яку згадав користувач):
{
  "actions": [
    {
      "intent": "create" | "edit",
      "scheduleType": "static" | "dynamic" | null,
      "groupName": "точна назва групи зі списку або null",
      "targetEventName": "назва наявної події для редагування або null",
      "event": {
        "name": "string|null",
        "teacherName": "string|null",
        "type": "string|null",
        "place": "string|null",
        "platform": "string|null",
        "link": "string|null",
        "description": "string|null",
        "tag": ["string"] | null,
        "day": "Пн|Вв|Ср|Чт|Пт|Сб|Вс|null",
        "date": "YYYY-MM-DD|null",
        "time": "HH:MM|null",
        "duration": number_in_minutes|null
      }
    }
  ],
  "reply": "коротке дружнє повідомлення користувачу"
}

Правила:
- Якщо користувач просить кілька подій (напр. «створи лекцію о 9:00 і практику о 11:00») — поверни ОКРЕМУ дію для кожної у масиві "actions".
- "static" — повторювана щотижнева подія (вказують день тижня, напр. «щопонеділка»). "dynamic" — разова подія на конкретну дату. Якщо не зрозуміло: коли є конкретна дата — "dynamic"; коли лише день тижня — "static"; інакше "dynamic".
- Для static заповнюй "day", для dynamic — "date" (обчисли реальну дату YYYY-MM-DD відносно поточної дати, враховуючи «завтра», «наступного понеділка» тощо).
- НЕ вигадуй значень: чого користувач не вказав — став null (окрім day/date/scheduleType, які виводь за правилами вище).
- intent "edit" лише якщо користувач хоче змінити НАЯВНУ подію; вкажи її в "targetEventName".
- Якщо прохання не про створення/редагування події — поверни "actions": [], а в "reply" чемно попроси переформулювати.
- "reply" — людською мовою (за правилом мови вище), решта значень — як у схемі.
- Поверни тільки JSON.`;
    },

    // Prompt for "/organizer": propose concise, relevant tags for existing events so
    // the schedule is easier to organize. Returns STRICT JSON; the backend turns each
    // proposal into a confirmable edit of the event's tags.
    organizerPrompt: (data = {}) => {
        const scheduleText = formatGroupsSchedule(data);
        const groupNames = (data.groups || []).map((g) => g.name).filter(Boolean);
        const groupsLine = groupNames.length
            ? groupNames.map((n) => `«${n}»`).join(', ')
            : '(немає доступних груп)';

        return `Ти — асистент, який пропонує доречні теги для подій розкладу, щоб краще їх організувати. Поверни ВИКЛЮЧНО валідний JSON-об'єкт без тексту до чи після.

${languageRule(data.lang)} (це стосується лише поля "reply").

Доступні групи: ${groupsLine}.

Поточний розклад:
${scheduleText}

Поверни JSON такої форми:
{
  "actions": [
    { "groupName": "точна назва групи зі списку", "targetEventName": "точна назва події з розкладу", "tags": ["тег1", "тег2"] }
  ],
  "reply": "коротке дружнє повідомлення користувачу"
}

Правила:
- Пропонуй теги лише для подій, які РЕАЛЬНО є у розкладі вище; "targetEventName" має точно збігатися з назвою події.
- 1–4 короткі теги на подію (маленькими літерами, без дублів): предмет, тип заняття, онлайн/офлайн, важливість (екзамен, проєкт) тощо.
- Якщо подія вже добре протегована або доречних тегів немає — не додавай її до "actions".
- Якщо пропонувати нічого — поверни "actions": [].
- Поверни тільки JSON.`;
=======
- Будь дружнім і лаконічним. Не вигадуй проблем, яких немає у списку.`;
>>>>>>> 06e77f52213d4457f5991beb1d9775aa4258bcf3
    },
};
