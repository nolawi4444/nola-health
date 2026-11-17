/* NOLA Voice: Web Speech API speech-to-text + speechSynthesis replies. Graceful fallback when unsupported. */
(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANG = { en: 'en-US', am: 'am-ET' };
  let rec = null;
  function listen({ lang, onResult, onEnd, onError }) {
    if (!SR) { onError && onError('unsupported'); return null; }
    try { if (rec) rec.abort(); } catch (e) {}
    rec = new SR(); rec.lang = LANG[lang] || 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    let final = '';
    rec.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) final += r[0].transcript; else interim += r[0].transcript; } onResult && onResult(final || interim, !!final); };
    rec.onerror = e => { onError && onError(e.error || 'error'); };
    rec.onend = () => { onEnd && onEnd(final); rec = null; };
    try { rec.start(); } catch (e) { onError && onError('start'); return null; }
    return rec;
  }
  function stop() { try { rec && rec.stop(); } catch (e) {} }
  function voices() { return window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  function pickVoice(lang) {
    const want = (LANG[lang] || 'en-US').toLowerCase(), pre = want.slice(0, 2), vs = voices();
    return vs.find(v => v.lang.toLowerCase() === want && /female|samantha|google|natural/i.test(v.name)) || vs.find(v => v.lang.toLowerCase() === want) || vs.find(v => v.lang.toLowerCase().startsWith(pre)) || null;
  }
  function hasVoice(lang) { return !!pickVoice(lang); }
  function clean(text) { return String(text).replace(/\*\*?|__|#+|`/g, '').replace(/•/g, '. ').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').replace(/\s+/g, ' ').trim(); }
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return false;
    const v = pickVoice(lang); if (!v && lang !== 'en') return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean(text).slice(0, 1200));
    if (v) u.voice = v; u.lang = LANG[lang] || 'en-US'; u.rate = 0.95; u.pitch = 1.0; u.volume = 1;
    speechSynthesis.speak(u); return true;
  }
  function stopSpeaking() { try { speechSynthesis.cancel(); } catch (e) {} }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
  window.NolaVoice = { get sttSupported() { return !!SR; }, get ttsSupported() { return 'speechSynthesis' in window; }, listen, stop, speak, stopSpeaking, hasVoice, clean };
})();
