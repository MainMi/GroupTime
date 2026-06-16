// Builds a markdown string from the analyzer's structured issues + the AI reply,
// so the result can be shown as a normal (markdown-rendered) chat message.
// `t` is the i18n translate fn (reuses the assistant.issue.* / weekday / field keys).

const issueText = (it, t) => {
    switch (it.type) {
        case 'overlap':
            return t('assistant.issue.overlap', {
                a: it.events[0], b: it.events[1],
                t1: it.meta?.firstTime, t2: it.meta?.secondTime,
            });
        case 'gap':
            return t('assistant.issue.gap', {
                min: it.meta?.minutes, a: it.events[0], b: it.events[1],
            });
        case 'overload':
            return t('assistant.issue.overload', { count: it.meta?.count });
        case 'duplicate':
            return t('assistant.issue.duplicate', { a: it.events[0], count: it.meta?.count });
        case 'missing': {
            const fields = (it.meta?.fields || [])
                .map((f) => t(`assistant.field.${f}`, f))
                .join(', ');
            return t('assistant.issue.missing', { a: it.events[0], fields });
        }
        default:
            return it.type;
    }
};

// Escape pipes so issue text doesn't break the markdown table layout.
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');

export const buildAnalysisMarkdown = (issues = [], reply = '', t) => {
    const lines = [`**${t('assistant.issuesTitle')}** (${issues.length})`, ''];

    if (!issues.length) {
        lines.push(t('assistant.noIssues'));
    } else {
        lines.push(`| ${t('assistant.colDay')} | ${t('assistant.colGroup')} | ${t('assistant.colIssue')} |`);
        lines.push('|---|---|---|');
        for (const it of issues) {
            const day = t(`assistant.weekday.${it.day}`, it.day);
            lines.push(`| ${cell(day)} | ${cell(it.groupName || '—')} | ${cell(issueText(it, t))} |`);
        }
    }

    if (reply) {
        lines.push('');
        lines.push(reply);
    }

    return lines.join('\n');
};
