/* NOLA HEALTH crypto helpers (WebCrypto only, no external libs).
   PBKDF2-SHA256 (210k iterations) -> AES-GCM-256. Used for: PIN lock (data at rest), encrypted backups, share packages. */
(function () {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const ok = () => !!(window.crypto && crypto.subtle);
  function b64u(buf) { const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  async function deriveKey(pass, salt, iter = 210000) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(pass).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encBytes(key, bytes) { const iv = rand(12); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes); return { iv: b64u(iv), ct: b64u(ct) }; }
  async function decBytes(key, o) { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(o.iv) }, key, unb64u(o.ct))); }
  async function encryptJSON(key, obj) { return Object.assign({ __enc: 1 }, await encBytes(key, enc.encode(JSON.stringify(obj)))); }
  async function decryptJSON(key, o) { return JSON.parse(dec.decode(await decBytes(key, o))); }
  async function deflate(bytes) {
    if (!window.CompressionStream) return null;
    const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function inflate(bytes) { const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); }
  /* Passphrase package: "NOLA1.<z|n>.<salt>.<iv>.<ct>" — z = deflated before encryption */
  async function sealText(pass, obj) {
    const raw = enc.encode(JSON.stringify(obj)); const z = await deflate(raw);
    const salt = rand(16), key = await deriveKey(pass, salt); const e = await encBytes(key, z || raw);
    return ['NOLA1', z ? 'z' : 'n', b64u(salt), e.iv, e.ct].join('.');
  }
  async function openText(pass, text) {
    const p = String(text).trim().replace(/\s+/g, '').split('.');
    if (p[0] !== 'NOLA1' || p.length !== 5) throw new Error('format');
    const key = await deriveKey(pass, unb64u(p[2]));
    let bytes; try { bytes = await decBytes(key, { iv: p[3], ct: p[4] }); } catch (e) { throw new Error('passphrase'); }
    if (p[1] === 'z') bytes = await inflate(bytes);
    return JSON.parse(dec.decode(bytes));
  }
  window.NolaCrypto = { ok, b64u, unb64u, rand, deriveKey, encryptJSON, decryptJSON, sealText, openText };
})();
