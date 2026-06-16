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

    return groups
        .map((g) => `=== Група «${g.name || '—'}» ===\n${formatSchedule(g.weekData)}`)
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
            case 'overlap':
                return `- Накладання у ${where}: «${it.events[0]}» (${it.meta?.firstTime}) і «${it.events[1]}» (${it.meta?.secondTime}) перетинаються за часом.`;
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

function nowContext() {
    const now = new Date();
    return {
        dayName: now.toLocaleDateString('uk-UA', { weekday: 'long' }),
        dateStr: now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }),
        timeStr: now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    };
}

module.exports = {
    DAY_NAMES,
    issuesToText,

    questionWithData: (question, data = {}) => {
        const { dayName: dn, dateStr, timeStr } = nowContext();
        const scheduleText = formatGroupsSchedule(data);
        const dayFilter = data.selectedDay ? `\nКористувача цікавить день: ${dayName(data.selectedDay)}.` : '';

        return `Ти — дружній AI-асистент для університетського розкладу. Відповідай виключно українською мовою.

Поточний час: ${dn}, ${dateStr}, ${timeStr}.

Про студента:
- Ім'я: ${data.user?.firstName || ''} ${data.user?.lastName || ''}

Розклад:
${scheduleText}${dayFilter}

Питання: "${question}"

Інструкція:
- Відповідай конкретно, дружньо та коротко (1–4 речення).
- Якщо питання стосується розкладу — давай точну відповідь з часом, місцем, викладачем.
- Якщо подій кілька груп — уточнюй, про яку групу йдеться.
- Якщо питається про найближчу подію — визнач її на основі поточного часу і дня.
- Не переказуй структуру даних та не згадуй JSON.
- Якщо інформації немає — скажи чесно.`;
    },

    // Prompt for the "detect problems" feature: the deterministic analyzer found
    // the issues; the model only explains them in friendly Ukrainian.
    analysisPrompt: (issues, data = {}) => {
        const { dayName: dn, dateStr, timeStr } = nowContext();
        const issuesText = issuesToText(issues);

        return `Ти — AI-асистент для університетського розкладу. Відповідай виключно українською мовою.

Поточний час: ${dn}, ${dateStr}, ${timeStr}.

Автоматичний аналіз розкладу${data.weekLabel ? ` (${data.weekLabel})` : ''} виявив такі моменти:
${issuesText}

Завдання:
- Якщо проблем немає — коротко підтвердь, що розклад виглядає добре.
- Інакше поясни знайдені проблеми простими словами, згрупуй за днями.
- Дай 1–2 практичні поради, як це виправити.
- Будь дружнім і лаконічним. Не вигадуй проблем, яких немає у списку.`;
    },
};
