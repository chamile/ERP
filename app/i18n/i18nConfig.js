import i18next from 'i18next';
import nbTranslations from './locales/nb/translations.json';
import enTranslations from './locales/en/translations.json';
import nnTranslations from './locales/nn/translations.json';

import 'moment/locale/nb.js';
import 'moment/locale/nn.js';

const instance = i18next.init({
  fallbackLng: "nb",
  ns: ["translations"],
  defaultNS: "translations",
  whitelist: ["nb", "en", "nn"],
  resources: {
    nb: {
      translations: nbTranslations
    },
    en: {
      translations: enTranslations
    },
    nn: {
      translations: nnTranslations
    }
  }
});

export default instance;
