/* NOLA HEALTH sharing (Family Health Circle & Clinician view).
   There is NO server. Sharing works by creating an encrypted, passphrase-protected package (AES-GCM, PBKDF2)
   that the owner sends (file / QR / text). The recipient opens it in their own copy of NOLA (read-only).
   The ShareAdapter interface below lets a real backend (see BACKEND.md) replace LocalPackageAdapter later. */
(function () {
  const DB = () => window.NolaDB, E = () => window.NolaEngine;
  const CATS = ['profile', 'conditions', 'meds', 'bp', 'glucose', 'weight', 'meals', 'glogs', 'plan', 'checkups', 'journey'];
  const DAY = 864e5;
  function collect(cats, days = 90) {
    const pr = DB().get('profile', {}), since = Date.now() - days * DAY, out = {};
    const rs = DB().get('readings', []).filter(r => r.ts >= since);
    if (cats.includes('profile')) out.profile = { name: pr.name, age: E().age(pr), gender: pr.gender || '', height: pr.height, weight: pr.weight, unit: pr.unit || 'mg' };
    if (cats.includes('conditions')) out.conditions = { conditions: pr.conditions || [], allergies: pr.allergies || [], allergyOther: pr.allergyOther || '', restrictions: pr.restrictions || [], goals: pr.goals || [], targets: E().targets(pr) };
    if (cats.includes('meds')) out.meds = pr.meds || '';
    ['bp', 'glucose', 'weight'].forEach(t => { if (cats.includes(t)) out[t] = rs.filter(r => r.type === t).map(r => Object.assign({}, r)); });
    if (cats.includes('meals')) out.meals = DB().get('meals', []).filter(m => m.ts >= since).map(m => ({ ts: m.ts, meal: m.meal, verdict: m.verdict, totals: m.totals, items: m.items.map(i => ({ foodId: i.foodId, name: i.name, mult: i.mult })) }));
    if (cats.includes('glogs')) out.glogs = DB().get('glogs', []).filter(l => l.ts >= since).map(l => { const c = Object.assign({}, l); if (!cats.includes('meds')) delete c.med; return c; });
    if (cats.includes('plan') && DB().get('plan')) { const p = DB().get('plan'); out.plan = { created: p.created, days: p.days.map(d => ({ date: d.date, fastingDay: d.fastingDay, meals: Object.fromEntries(Object.entries(d.meals).map(([k, m]) => [k, m.dish])) })) }; }
    if (cats.includes('checkups')) out.checkups = DB().get('checkups', []);
    if (cats.includes('journey')) out.journey = { week: window.NolaInsights.periodSummary(7), month: window.NolaInsights.periodSummary(30), since: pr.created };
    return out;
  }
  /* ---- adapter interface ----
     createShare({recipient, role, cats, passphrase, expiresDays}) -> {share, text}
     listShares() -> [share]; revokeShare(id) -> share; openShare(text, passphrase) -> payload */
  const LocalPackageAdapter = {
    name: 'local-package', live: false,
    async createShare({ recipient, role, cats, passphrase, expiresDays }) {
      if (!window.NolaCrypto.ok()) throw new Error('WebCrypto unavailable');
      const pr = DB().get('profile', {}), id = 'sh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const created = Date.now(), expires = created + (+expiresDays || 30) * DAY;
      const payload = { t: 'nola-share', v: 1, id, from: pr.name || '', role, recipient, created, expires, cats, data: collect(cats) };
      const text = await window.NolaCrypto.sealText(passphrase, payload);
      const share = { id, recipient, role, cats, created, expires, status: 'active', size: text.length, adapter: this.name };
      DB().set('shares', DB().get('shares', []).concat([share]));
      return { share, text };
    },
    listShares() { return DB().get('shares', []).map(s => Object.assign({}, s, { status: s.status === 'active' && s.expires < Date.now() ? 'expired' : s.status })); },
    async revokeShare(id) { const list = DB().get('shares', []).map(s => s.id === id ? Object.assign({}, s, { status: 'revoked', revoked: Date.now() }) : s); DB().set('shares', list); return list.find(s => s.id === id); },
    async openShare(text, passphrase) {
      const p = await window.NolaCrypto.openText(passphrase, text);
      if (!p || p.t !== 'nola-share') throw new Error('format');
      return p;
    },
  };
  /* Placeholder for a future server-backed adapter (Supabase/Postgres with row-level security).
     Intentionally NOT functional: it requires a server, auth and verified accounts. See BACKEND.md. */
  const SupabaseAdapter = {
    name: 'supabase', live: true, configured: false,
    async createShare() { throw new Error('requires server — not active'); },
    listShares() { return []; }, async revokeShare() { throw new Error('requires server — not active'); }, async openShare() { throw new Error('requires server — not active'); },
  };
  function saveReceived(p) {
    const list = DB().get('supporting', []).filter(x => x.id !== p.id);
    list.push({ id: p.id, from: p.from, role: p.role, created: p.created, expires: p.expires, cats: p.cats, data: p.data, opened: Date.now() });
    DB().set('supporting', list);
  }
  function qrSvg(text) {
    if (!window.qrcode || text.length > 2300) return null;
    try { const q = window.qrcode(0, 'L'); q.addData(text, 'Byte'); q.make(); return q.createSvgTag({ cellSize: 3, margin: 3, scalable: true }); } catch (e) { return null; }
  }
  function passphrase() { const w = ['teff', 'buna', 'gomen', 'shiro', 'misir', 'kolo', 'dabo', 'ayib', 'mango', 'lemon', 'koseret', 'tena', 'adam', 'mesob', 'jebena', 'sini', 'berbere', 'tikur', 'arenguade', 'birtukan']; const r = crypto.getRandomValues(new Uint32Array(4)); return Array.from(r).map(x => w[x % w.length]).join('-') + '-' + (r[0] % 90 + 10); }
  window.NolaShare = { CATS, collect, adapter: LocalPackageAdapter, adapters: { local: LocalPackageAdapter, supabase: SupabaseAdapter }, saveReceived, qrSvg, passphrase };
})();
