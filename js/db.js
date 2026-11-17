/* NOLA HEALTH offline database: IndexedDB key-value store with in-memory cache (localStorage fallback).
   Optional encryption at rest: when a PIN is set every value is stored as AES-GCM ciphertext with a key derived from the PIN.
   UI prefs (language, text size) live unencrypted in localStorage 'nola_ui' so the lock screen can be shown in the right language. */
(function () {
  const DB_NAME = 'nola-health', STORE = 'kv', META = 'nola_lock';
  let idb = null, key = null, locked = false, raw = {};
  const cache = {};
  let queue = Promise.resolve();
  function open() {
    return new Promise(res => {
      try {
        if (!window.indexedDB) return res(null);
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null);
        setTimeout(() => res(null), 3000);
      } catch (e) { res(null); }
    });
  }
  function idbAll() {
    return new Promise(res => {
      const out = {}; try {
        const rq = idb.transaction(STORE).objectStore(STORE).openCursor();
        rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
        rq.onerror = () => res(out);
      } catch (e) { res(out); }
    });
  }
  function meta() { try { return JSON.parse(localStorage.getItem(META) || 'null'); } catch (e) { return null; } }
  async function init() {
    idb = await open();
    raw = idb ? await idbAll() : {};
    try { Object.keys(localStorage).filter(k => k.startsWith('nola_') && k !== META && k !== 'nola_ui').forEach(k => { const kk = k.slice(5); if (raw[kk] == null) { try { raw[kk] = JSON.parse(localStorage.getItem(k)); } catch (e) {} } }); } catch (e) {}
    locked = !!meta();
    if (!locked) Object.keys(raw).forEach(k => { cache[k] = raw[k]; });
    return !!idb;
  }
  async function unlock(pin) {
    const m = meta(); if (!m) return true;
    const k = await NolaCrypto.deriveKey(pin, NolaCrypto.unb64u(m.salt), m.iter);
    try { const v = await NolaCrypto.decryptJSON(k, m.verifier); if (v !== 'nola-ok') return false; } catch (e) { return false; }
    for (const name of Object.keys(raw)) {
      const v = raw[name];
      try { cache[name] = v && v.__enc ? await NolaCrypto.decryptJSON(k, v) : v; } catch (e) { cache[name] = null; }
    }
    key = k; locked = false; return true;
  }
  async function verify(pin) {
    const m = meta(); if (!m) return true;
    try { const k = await NolaCrypto.deriveKey(pin, NolaCrypto.unb64u(m.salt), m.iter); return (await NolaCrypto.decryptJSON(k, m.verifier)) === 'nola-ok'; } catch (e) { return false; }
  }
  function persist(k, v) {
    queue = queue.then(async () => {
      let val = v;
      if (key && v != null) val = await NolaCrypto.encryptJSON(key, v);
      if (idb) { try { await new Promise((res, rej) => { const tx = idb.transaction(STORE, 'readwrite'); v == null ? tx.objectStore(STORE).delete(k) : tx.objectStore(STORE).put(val, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); return; } catch (e) {} }
      try { v == null ? localStorage.removeItem('nola_' + k) : localStorage.setItem('nola_' + k, JSON.stringify(val)); } catch (e) { console.warn('storage full', e); }
    }).catch(e => console.warn('persist', e));
    return queue;
  }
  function get(k, def) { return cache[k] ?? def; }
  function set(k, v) { cache[k] = v; return persist(k, v); }
  async function rewriteAll() { for (const k of Object.keys(cache)) persist(k, cache[k]); await queue; }
  async function enableLock(pin) {
    const salt = NolaCrypto.rand(16), iter = 210000;
    const k = await NolaCrypto.deriveKey(pin, salt, iter);
    const verifier = await NolaCrypto.encryptJSON(k, 'nola-ok');
    key = k; await rewriteAll();
    localStorage.setItem(META, JSON.stringify({ salt: NolaCrypto.b64u(salt), iter, verifier, v: 1 }));
    // remove any plaintext localStorage fallbacks
    if (idb) try { Object.keys(localStorage).filter(x => x.startsWith('nola_') && x !== META && x !== 'nola_ui').forEach(x => localStorage.removeItem(x)); } catch (e) {}
  }
  async function disableLock() { key = null; localStorage.removeItem(META); await rewriteAll(); }
  async function clear() {
    Object.keys(cache).forEach(k => delete cache[k]); raw = {}; key = null; locked = false;
    try { Object.keys(localStorage).filter(k => k.startsWith('nola_') && k !== 'nola_ui').forEach(k => localStorage.removeItem(k)); } catch (e) {}
    if (idb) await new Promise(res => { const tx = idb.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear(); tx.oncomplete = res; tx.onerror = res; });
  }
  function dump() { return JSON.parse(JSON.stringify(cache)); }
  function ui(p) { let u = {}; try { u = JSON.parse(localStorage.getItem('nola_ui') || '{}'); } catch (e) {} if (p) { u = Object.assign(u, p); localStorage.setItem('nola_ui', JSON.stringify(u)); } return u; }
  window.NolaDB = { init, unlock, verify, get, set, clear, dump, enableLock, disableLock, ui, flush: () => queue,
    get usingIDB() { return !!idb; }, get locked() { return locked; }, get encrypted() { return !!meta(); } };
})();
