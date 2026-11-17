/* Tiny offline database: IndexedDB key-value store with in-memory cache; falls back to localStorage. */
(function () {
  const DB_NAME = 'nola-health', STORE = 'kv';
  let idb = null; const cache = {};
  function open() {
    return new Promise(res => {
      try {
        if (!window.indexedDB) return res(null);
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => res(null);
        setTimeout(() => res(null), 3000);
      } catch (e) { res(null); }
    });
  }
  async function init(keys) {
    idb = await open();
    for (const k of keys) {
      let v = null;
      if (idb) v = await new Promise(res => { try { const rq = idb.transaction(STORE).objectStore(STORE).get(k); rq.onsuccess = () => res(rq.result ?? null); rq.onerror = () => res(null); } catch (e) { res(null); } });
      if (v == null) { try { const s = localStorage.getItem('nola_' + k); if (s) v = JSON.parse(s); } catch (e) {} }
      cache[k] = v;
    }
    return !!idb;
  }
  function get(k, def) { return cache[k] ?? def; }
  function set(k, v) {
    cache[k] = v;
    if (idb) { try { idb.transaction(STORE, 'readwrite').objectStore(STORE).put(v, k); } catch (e) { lsSet(k, v); } }
    else lsSet(k, v);
  }
  function lsSet(k, v) { try { localStorage.setItem('nola_' + k, JSON.stringify(v)); } catch (e) { console.warn('storage full', e); } }
  async function clear() {
    Object.keys(cache).forEach(k => delete cache[k]);
    try { Object.keys(localStorage).filter(k => k.startsWith('nola_')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    if (idb) await new Promise(res => { const tx = idb.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear(); tx.oncomplete = res; tx.onerror = res; });
  }
  function dump() { return JSON.parse(JSON.stringify(cache)); }
  window.NolaDB = { init, get, set, clear, dump, get usingIDB() { return !!idb; } };
})();
