// Language utilities for localized output. Designed to scale beyond the current
// uk/en pair: add a code to SUPPORTED_LANGUAGES (and a matching key in the
// constant/assistantText entries) and everything keyed by resolveLanguage picks
// it up — no isUk-style boolean branching to chase down.

const DEFAULT_LANGUAGE = 'uk';
const SUPPORTED_LANGUAGES = [
    'uk',
    'en'
];

// Normalize a raw lang string (e.g. 'en-US') to a supported code, defaulting to
// DEFAULT_LANGUAGE for anything unknown.
const resolveLanguage = (lang) => {
    const code = String(lang || '').slice(0, 2).toLowerCase();
    return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
};

// Whether the requested language resolves to `code`, e.g. isLanguage(lang, 'en').
const isLanguage = (lang, code) => resolveLanguage(lang) === code;

module.exports = {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    resolveLanguage,
    isLanguage,
};
