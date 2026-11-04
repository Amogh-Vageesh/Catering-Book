// Test-only stand-in for CloudFB. Shares one "server" between browser tabs through localStorage
// (key mockdb.*), so two pages can act as two people on two phones.
(function () {
  const K = 'mockdb.store', AU = 'mockdb.user.' + (new URLSearchParams(location.search).get('as') || 'a');
  const rd = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const wr = s => localStorage.setItem(K, JSON.stringify(s));
  let authCb = null, listeners = [], clock = Date.now();
  const user = () => { try { return JSON.parse(localStorage.getItem(AU) || 'null'); } catch (e) { return null; } };
  const role = () => { const u = user(); const m = u && (rd().members || {})[u.email]; return m && m.role; };
  const deny = msg => Promise.reject(Object.assign(new Error(msg), { code: 'permission-denied' }));
  function fire(coll) { listeners.filter(l => l.c === coll).forEach(l => l.poll()); }
  window.addEventListener('storage', e => { if (e.key === K) listeners.forEach(l => l.poll()); });
  window.CloudFB = {
    init() {}, onAuth(cb) { authCb = cb; setTimeout(() => cb(user()), 0); },
    async signIn() { const email = (new URLSearchParams(location.search).get('email') || 'owner@test.in'); const u = { email, name: email.split('@')[0], verified: true }; localStorage.setItem(AU, JSON.stringify(u)); authCb && authCb(u); },
    async signOut() { localStorage.removeItem(AU); Object.keys(localStorage).filter(k => k.startsWith('caterbook.')).forEach(k => localStorage.removeItem(k)); listeners = []; },
    async getMember(e) { return (rd().members || {})[e] || null; },
    listMembers(cb) { const l = { c: '__m', poll: () => cb(Object.entries(rd().members || {}).map(([email, v]) => ({ email, ...v }))) }; listeners.push(l); l.poll(); },
    async putMember(e, d) { const u = user(); const s = rd(); const isBoot = !Object.keys(s.members || {}).length && d.role === 'owner'; if (!isBoot && role() !== 'owner') return deny('owner only'); s.members = s.members || {}; s.members[e] = { ...(s.members[e] || {}), ...d }; wr(s); fire('__m'); },
    async delMember(e) { if (role() !== 'owner') return deny('owner only'); const s = rd(); delete s.members[e]; wr(s); fire('__m'); },
    async start(colls, onDocs) {
      colls.concat(['settings']).forEach(c => {
        let seen = 0;
        const l = { c, poll() { const s = rd(); const all = Object.values((s.data || {})[c] || {}).filter(d => d.u > seen); if (all.length) { seen = Math.max(...all.map(d => d.u)); onDocs(c, all.map(d => { const x = { ...d }; delete x.u; return x; }), false); } } };
        listeners.push(l); l.poll();
      });
    },
    async put(c, id, data) { const r = role(); if (!r || r === 'family') return deny('read only'); const s = rd(); s.data = s.data || {}; s.data[c] = s.data[c] || {}; const prev = s.data[c][id]; if (r === 'manager' && data.deleted) return deny('no delete'); s.data[c][id] = { ...JSON.parse(JSON.stringify(data)), id, u: ++clock }; wr(s); fire(c); },
    async remove(c, id) { const r = role(); if (r !== 'owner') return deny('owner only'); const s = rd(); s.data[c][id] = { id, deleted: true, u: ++clock }; wr(s); fire(c); },
    async putSettings(d) { if (role() !== 'owner') return deny('owner only'); const s = rd(); s.data = s.data || {}; s.data.settings = { app: { ...((s.data.settings || {}).app || {}), ...d, id: 'app', u: ++clock } }; wr(s); fire('settings'); },
    async putBill(id, b) { const r = role(); if (!r || r === 'family') return deny('read only'); const s = rd(); s.bills = s.bills || {}; s.bills[id] = b; wr(s); },
    async getBill(id) { return (rd().bills || {})[id] || null; },
    async delBill(id) { const s = rd(); delete (s.bills || {})[id]; wr(s); },
  };
})();
