# Catering Book — GitHub builder

This repo builds two things every time you push to `main`:
- the **Android app** (APK, in Releases), and
- the **web app** at **https://catering-book.web.app** (for laptop and iPhone).

Owners while testing: `rvagee@gmail.com`, `vinayakan1609@gmail.com` (set in `config.json` and `firestore.rules`).

## One-time setup (about 15 minutes)

### 1. Put this code in your repo
1. github.com → your new **private** repo `catering-book` (empty).
2. **Add file → Upload files** → drag in **everything** from this zip, including the `.github` folder → **Commit changes**.
   The first build starts by itself. It will publish nothing and skip the APK — that's expected until steps 2–4 are done.

### 2. Create the app signing key
1. Repo → **Actions** → **1 - Create signing key (run once)** → **Run workflow**.
2. Open the finished run. The summary shows the **SHA-1** — copy it.
3. At the bottom, download **signing-key** and unzip it.
4. Repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `KEYSTORE_BASE64` = everything inside `KEYSTORE_BASE64.txt`
   - `KEYSTORE_PASSWORD` = everything inside `KEYSTORE_PASSWORD.txt`
5. Save `catering-book-signing-key.jks` **and** the password in your Google Drive. Every future update must use this same key, or phones won't accept the update.
6. Delete the downloaded files from your laptop.

### 3. Tell Firebase about the Android app
1. Firebase → ⚙️ Project settings → **Your apps → Add app → Android**.
2. Package name: `in.cateringbook.app` → paste the **SHA-1** from step 2 → **Register app**.
3. Skip downloading `google-services.json` (not needed) → Next → Continue to console.
4. Optional: in the same Android app card, **Add fingerprint** → paste the SHA-256 from the summary.

### 4. Let GitHub publish the web app
1. Firebase → ⚙️ Project settings → **Service accounts** → **Generate new private key** → a `.json` file downloads.
2. GitHub → Settings → Secrets and variables → Actions → **New repository secret**
   - Name `FIREBASE_SERVICE_ACCOUNT` · Value = the whole contents of that `.json` file.
3. Delete the `.json` file from your laptop.

### 5. Build
Actions → **2 - Build app** → **Run workflow**.
- APK: repo → **Releases** → `CateringBook-1.0.N.apk` → install on the phone.
- Web: open **https://catering-book.web.app** on the laptop; on iPhone open it in Safari → Share → **Add to Home Screen**.
- Sign in with an owner Gmail.

## Updating the rules (needed for this version)
This version adds co-owner / staff roles, view-only access, cash advances and price-free orders for the team.
Firebase → Firestore Database → **Rules** → delete everything → paste all of `firestore.rules` → **Publish**.
Until you do, managers' and staff's saves will be refused.

## Later
- Every push to `main` builds a new version (`1.0.N`) that installs over the old one and keeps data.
- Owners/managers/family are managed inside the app: ⚙️ → Team & roles.
- Before going live with others, trim the owner list in Firebase → Firestore → Rules (and tell me to update `config.json`).

## If something fails
- **Publish web app** step fails with a permission error → Google Cloud console → IAM → find the `firebase-adminsdk-…` account → add roles **Firebase Hosting Admin** and **API Keys Viewer**, then re-run.
- **Sign-in on the APK says "no credentials" or "developer error"** → the SHA-1 in Firebase (step 3) doesn't match. Copy it again from the latest build summary.
- Anything else → send me a screenshot of the red step.
