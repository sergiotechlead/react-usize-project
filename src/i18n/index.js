import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esCommon    from './locales/es/common.json';
import esHome      from './locales/es/home.json';
import esPricing   from './locales/es/pricing.json';
import esDocs      from './locales/es/docs.json';
import esContact   from './locales/es/contact.json';
import esAuth      from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esNotfound  from './locales/es/notfound.json';
import esForm      from './locales/es/form.json';
import esTeam      from './locales/es/team.json';

import enCommon    from './locales/en/common.json';
import enHome      from './locales/en/home.json';
import enPricing   from './locales/en/pricing.json';
import enDocs      from './locales/en/docs.json';
import enContact   from './locales/en/contact.json';
import enAuth      from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enNotfound  from './locales/en/notfound.json';
import enForm      from './locales/en/form.json';
import enTeam      from './locales/en/team.json';

const savedLang = localStorage.getItem('usize-lang')
  || navigator.language?.split('-')[0]
  || 'es';

const supportedLangs = ['es', 'en'];
const lng = supportedLangs.includes(savedLang) ? savedLang : 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: esCommon, home: esHome, pricing: esPricing, docs: esDocs, contact: esContact, auth: esAuth, dashboard: esDashboard, notfound: esNotfound, form: esForm, team: esTeam },
      en: { common: enCommon, home: enHome, pricing: enPricing, docs: enDocs, contact: enContact, auth: enAuth, dashboard: enDashboard, notfound: enNotfound, form: enForm, team: enTeam },
    },
    lng,
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
