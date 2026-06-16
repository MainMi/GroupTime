import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uk from './locales/uk.json';
import en from './locales/en.json';

// Two-language setup (Ukrainian / English). The detector picks the language from
// localStorage first, then the browser; the chosen language is cached back to
// localStorage so it persists across reloads. Default/fallback is Ukrainian.
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            uk: { translation: uk },
            en: { translation: en },
        },
        fallbackLng: 'uk',
        supportedLngs: ['uk', 'en'],
        load: 'languageOnly', // map uk-UA / en-US -> uk / en
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
    });

export default i18n;
