/* NOLA HEALTH language registry.
   Each language is one "locale file": I18N.register(code, meta, strings). Missing keys fall back to English.
   HOW TO ADD A LANGUAGE (e.g. Afaan Oromo):
     1. Create js/locales/om.js containing:  I18N.register('om', { name: 'Afaan Oromo', native: 'Afaan Oromoo', speech: 'om-ET' }, { nav_home: '...', ... });
     2. Translate the keys from I18N.LANGS.en (run I18N.missing('om') in the console to list untranslated keys).
     3. Add <script src="js/locales/om.js"> after locales.js in index.html and to sw.js SHELL, then set status 'ready'.
   Languages marked 'soon' are shown in the selector as "Coming soon" and cannot be selected. */
(function () {
  const REG = [
    { code: 'en', name: 'English', native: 'English', speech: 'en-US', status: 'ready' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ', speech: 'am-ET', status: 'ready' },
    { code: 'om', name: 'Afaan Oromo', native: 'Afaan Oromoo', speech: 'om-ET', status: 'soon' },
    { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ', speech: 'ti-ET', status: 'soon' },
    { code: 'so', name: 'Somali', native: 'Soomaali', speech: 'so-SO', status: 'soon' },
  ];
  I18N.REGISTRY = REG;
  I18N.register = function (code, meta, strings) {
    I18N.LANGS[code] = Object.assign(I18N.LANGS[code] || {}, strings || {});
    const r = REG.find(x => x.code === code);
    if (r) Object.assign(r, meta || {}, { status: 'ready' }); else REG.push(Object.assign({ code, status: 'ready' }, meta));
  };
  I18N.ready = () => REG.filter(r => r.status === 'ready' && I18N.LANGS[r.code]);
  I18N.speechLang = code => (REG.find(r => r.code === code) || {}).speech || 'en-US';
})();
