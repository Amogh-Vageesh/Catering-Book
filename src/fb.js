// Firebase adapter for Catering Book. Bundled into the app as window.CloudFB.
// Interface (same as the test mock):
//   init(config) · onAuth(cb(user|null)) · signIn() · signOut()
//   getMember(email) · listMembers(cb) · putMember(email,data) · delMember(email)
//   start(colls, onDocs(coll, docs[])) · put(coll,id,data) · remove(coll,id)
//   putBill(id,{data,mime,size}) · getBill(id) · delBill(id)
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, signOut as fbSignOut, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, setDoc, getDoc, getDocFromCache, getDocsFromCache, onSnapshot, query, where, serverTimestamp, Timestamp, terminate, clearIndexedDbPersistence, deleteDoc } from 'firebase/firestore';

let app, auth, db, unsubs = [];
const LS = 'caterbook.sync.';

function init(config) {
  app = initializeApp(config);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  getRedirectResult(auth).catch(() => {});
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
}
function onAuth(cb) { return onAuthStateChanged(auth, u => cb(u ? { email: (u.email || '').toLowerCase(), name: u.displayName || '', verified: u.emailVerified, photo: u.photoURL || '' } : null)); }

async function signIn() {
  // Android APK: native Google sign-in through the bridge, then hand the ID token to Firebase.
  if (window.AndroidBridge && AndroidBridge.googleSignIn) {
    const token = await new Promise((res, rej) => {
      window.__onGoogleIdToken = (t, err) => (t ? res(t) : rej(new Error(err || 'Sign-in cancelled')));
      AndroidBridge.googleSignIn();
    });
    return signInWithCredential(auth, GoogleAuthProvider.credential(token));
  }
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  // iPhone/iPad home-screen app (and other standalone launches) can't open popups — use a full-page redirect there.
  const standalone = (window.navigator.standalone === true) || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (standalone || ios) return signInWithRedirect(auth, p);
  try { return await signInWithPopup(auth, p); }
  catch (e) { if (e && /popup-blocked|operation-not-supported/.test(e.code || '')) return signInWithRedirect(auth, p); throw e; }
}

async function signOut() {
  unsubs.forEach(u => u()); unsubs = [];
  try { await fbSignOut(auth); } catch (e) {}
  try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) {}
  Object.keys(localStorage).filter(k => k.startsWith('caterbook.')).forEach(k => localStorage.removeItem(k));
  if (window.AndroidBridge && AndroidBridge.googleSignOut) { try { AndroidBridge.googleSignOut(); } catch (e) {} }
}

async function getMember(email) {
  const s = await getDoc(doc(db, 'members', email));
  return s.exists() ? s.data() : null;
}
function listMembers(cb) {
  const u = onSnapshot(collection(db, 'members'), s => cb(s.docs.map(d => ({ email: d.id, ...d.data() }))), () => {});
  unsubs.push(u);
}
const putMember = (email, data) => setDoc(doc(db, 'members', email), data, { merge: true });
const delMember = email => deleteDoc(doc(db, 'members', email));

// Incremental sync: load everything from the on-device cache first (no reads billed),
// then listen only for documents changed since the newest one we already have.
async function start(colls, onDocs, filters) {
  filters = filters || {};
  for (const c of colls) {
    // Team members (not owners) only receive their own records, e.g. their own expenses and cash advances.
    if (filters[c]) {
      for (const [f, v] of filters[c]) {
        const u = onSnapshot(query(collection(db, c), where(f, '==', v)), s => {
          const docs = []; s.docChanges().forEach(ch => { if (ch.type !== 'removed') docs.push({ ...ch.doc.data(), id: ch.doc.id }); });
          if (docs.length) onDocs(c, docs, false);
        }, err => console.warn('sync', c, err.code));
        unsubs.push(u);
      }
      continue;
    }
    let maxU = 0;
    try {
      const snap = await getDocsFromCache(collection(db, c));
      const docs = snap.docs.map(d => { const x = d.data(); const u = x.u && x.u.toMillis ? x.u.toMillis() : 0; if (u > maxU) maxU = u; return { ...x, id: d.id }; });
      if (docs.length) onDocs(c, docs, true);
    } catch (e) {}
    const saved = +(localStorage.getItem(LS + c) || 0);
    if (!maxU) maxU = 0; else maxU = Math.min(maxU, saved || maxU);
    const q = query(collection(db, c), where('u', '>', Timestamp.fromMillis(Math.max(0, maxU - 60000))));
    const u = onSnapshot(q, { includeMetadataChanges: false }, s => {
      const docs = [];
      s.docChanges().forEach(ch => { if (ch.type === 'removed') return; const x = ch.doc.data(); const t = x.u && x.u.toMillis ? x.u.toMillis() : 0; if (t > maxU) maxU = t; docs.push({ ...x, id: ch.doc.id }); });
      if (docs.length) onDocs(c, docs, false);
      if (!s.metadata.hasPendingWrites && maxU) { try { localStorage.setItem(LS + c, String(maxU)); } catch (e) {} }
    }, err => console.warn('sync', c, err.code));
    unsubs.push(u);
  }
  const su = onSnapshot(doc(db, 'settings', 'app'), s => { if (s.exists()) onDocs('settings', [s.data()], false); }, () => {});
  unsubs.push(su);
}
const clean = o => JSON.parse(JSON.stringify(o)); // drop undefined
const put = (c, id, data) => setDoc(doc(db, c, id), { ...clean(data), u: serverTimestamp() });
const remove = (c, id) => setDoc(doc(db, c, id), { id, deleted: true, u: serverTimestamp() });
const putSettings = data => setDoc(doc(db, 'settings', 'app'), clean(data), { merge: true });

const putBill = (id, b) => setDoc(doc(db, 'bills', id), { ...b, u: serverTimestamp() });
async function getBill(id) {
  try { const s = await getDocFromCache(doc(db, 'bills', id)); if (s.exists()) return s.data(); } catch (e) {}
  const s = await getDoc(doc(db, 'bills', id)); return s.exists() ? s.data() : null;
}
const delBill = id => deleteDoc(doc(db, 'bills', id));

window.CloudFB = { init, onAuth, signIn, signOut, getMember, listMembers, putMember, delMember, start, put, remove, putSettings, putBill, getBill, delBill };
