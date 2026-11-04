# Catering Book — Firebase setup

About 20 minutes on a laptop, signed in with the **owner's Google account**.
Everything stays on the **free Spark plan** — no card needed.

## What you send me at the end
| # | What | Where you find it | Secret? |
|---|---|---|---|
| 1 | **firebaseConfig block** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) | Step 4 | No — safe to paste in chat |
| 2 | **Owner Gmail(s)** — everyone who should be Owner while testing | — | No |
| 3 | **Web client ID** (ends in `.apps.googleusercontent.com`) | Step 2.3 | No |
| 4 | **Package name** you want for the Android app (default `in.cateringbook.app`) | — | No |
| 5 | **GitHub repo name** for the builder (new, empty, e.g. `catering-book`) | github.com → New repository | No |

**Never paste in chat:** the service-account key file (step 7), your Google password, or the app signing key password. Those go straight into GitHub secrets.

---

## 1. Create the project
1. https://console.firebase.google.com → **Create a project** → name `catering-book` (or your business name).
2. Google Analytics → **off** → Create.

## 2. Turn on Google sign-in
1. Build → **Authentication** → Get started → Sign-in method → **Google** → Enable.
2. Support email = owner's Gmail → **Save**.
3. Open Google again → expand **Web SDK configuration** → copy the **Web client ID** (send me this — it's what the Android app uses to sign in).
4. Authentication → Settings → **Authorized domains**: `<project-id>.web.app` and `<project-id>.firebaseapp.com` are there by default. Leave them.

## 3. Create the database
1. Build → **Firestore Database** → Create database → **Standard edition**.
2. Location: **asia-south1 (Mumbai)** → **Start in production mode** → Create.
3. **Rules** tab → delete everything → paste all of `firestore.rules`.
4. Find `['OWNER_EMAIL_1', 'OWNER_EMAIL_2']` and put in **every Gmail that should be an Owner while testing**, small letters, in quotes, comma-separated — e.g. `['you@gmail.com', 'owner@gmail.com']`. Add or remove entries as needed → **Publish**.

## 4. Register the web app (laptop + iPhone)
1. ⚙️ Project settings → **Your apps** → **</>** (Web).
2. Nickname `catering-web` → tick **Also set up Firebase Hosting** → Register app.
3. Copy the `firebaseConfig = { … }` block → **send me this**.
4. Skip the "Install Firebase CLI" and "Deploy" screens — the GitHub builder does that.

## 5–7. Android app, GitHub and publishing
Follow **README-FIRST.md** in the builder zip — it covers the signing key (SHA-1), adding the Android app in Firebase, the GitHub secrets and the first build.

---

## After it's live
- **Owner** opens the link (or APK) and signs in with the owner Gmail → becomes owner automatically.
- **Add people** in ⚙️ → Team & roles by their Google email: Manager (add/edit, no delete, no profit/tax) or Family (view only).
- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- Switching someone off signs them out on their next sync. Signing out wipes business data from that device.

## Free limits (Spark plan)
| | Free | Typical use |
|---|---|---|
| Stored data | 1 GiB total | records ≈ a few MB a year; bills ≈ 25 MB per 100 |
| Reads | 50,000 / day | app downloads only what changed since last open |
| Writes | 20,000 / day | a busy day is a few hundred |
| Hosting | 10 GB stored, 360 MB/day transfer | the app is ~1 MB |

If bills approach 1 GiB (≈3 years at 100 bills/month), move to the Blaze plan.

## Bill reader
Runs on the phone/laptop itself — bills aren't sent to any outside service. First use downloads the reader once (~7 MB) from cdn.jsdelivr.net, then it's cached. Always shows a review screen before saving.

## iPhone notes
I set `authDomain` to `<project-id>.web.app` so Safari keeps you signed in. Camera, bill scan, PDF, Kannada, offline use and sync all work in Safari; exports open the share sheet.
