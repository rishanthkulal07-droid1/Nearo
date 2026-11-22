NEARO - SOURCE CODE (plain text files, editable in any code editor)
====================================================================

FOLDER MAP
  index.html            Page structure: header, tabs, every screen, pop-up dialogs.
  css/styles.css        All styling. Colours are the variables at the top (:root). Later blocks override earlier ones.
                        Search for: "trade backgrounds" (wood, snowflakes, splashes...), "certified partner" (badges).
  js/config.js          SETTINGS AND DATA: site name, search range, fees, trades, sample handymen, material prices,
                        cities, icons, payment split (88% / 7% / 5%), wallet limit and bonus.
  js/i18n.js            Translations: English, Kannada, Hindi (table D, sentence rules in RULES).
  js/app.js             Core app: find handymen, booking, orders, handyman dashboard, profiles, material prices,
                        quotes, OTP completion, payments, rewards, language switching.
  js/admin.js           Sign-in / sign-up, accounts, sessions and the admin console.
  js/studio.js          Code studio (admins can change the app from inside the app).
  js/start.js           Start-up. Runs last.
  js/pwa.js, sw.js, manifest.webmanifest, icons/    Make the site installable as a phone app.

The scripts are plain (non-module) files that share one scope and must load in this order:
config, i18n, app, admin, studio, start (already set in index.html).

HOW TO EDIT AND TEST
  1. Edit any file in a text editor (VS Code, Notepad++, etc.).
  2. Run a local server in this folder (for example:  python3 -m http.server 8000 ) and open http://localhost:8000
     (a server is needed for sign-in storage, the installable app and the in-app "App source" viewer).
  3. Upload ALL files to an HTTPS host (Netlify Drop, Vercel, GitHub Pages, Firebase Hosting) to publish.
  After you change a file, hard-refresh the browser (or bump CACHE = "nearo-v14" in sw.js) so installed copies update.

COMMON CHANGES
  Add a trade ................ js/config.js: CATEGORIES + ICONS; js/i18n.js: add the name to D; css: add a [data-trade="..."] background.
  Change a price / material .. js/config.js: MATERIALS and CITIES.
  Change the payment split ... js/app.js: SPLIT, WALLET_MAX, BONUS (search "OTP, payments, rewards").
  Change reward steps ........ js/app.js: MILES and tier() (15 / 30 / 50 / 100 jobs).
  Change colours ............. css/styles.css: the --brand, --bg, --line variables.
  Add a language ............. js/i18n.js (new column in D and RULES) and the language buttons in index.html.

SIGN-IN, ROLES AND ADMIN
  - One sign-in page with three tabs: Customer, Handyman, Staff / Admin.
  - Customers and handymen sign in with mobile number + password (create an account on the same page).
  - Staff and admins sign in with a personal ACCESS CODE. First admin code: NEARO-ADMIN-2026
    (you are forced to replace it on first sign-in).
  - Admin level: everything (access codes, settings, accounts, bookings, material prices, Code studio).
  - Employee level: accounts (suspend / reset password), bookings, material prices.

CODE STUDIO (Admin > Code studio, administrators only)
  - CSS / JavaScript / HTML editors that change the app from inside the app. CSS and HTML apply instantly;
    JavaScript runs at startup (the app reloads after saving). Every save keeps the last 10 versions.
  - If a change breaks the app, open the site with ?safe=1 to switch custom code off.
  - Settings (JSON), Translations editor, Terminal, and a read-only "App source" viewer (shows all files).

IMPORTANT BEFORE YOU LAUNCH
  - Accounts, access codes, bookings, payments and settings are stored in the browser (localStorage). They are NOT shared
    between devices and are NOT real security: anyone with a browser can read or change them. For real customers move
    accounts, bookings and roles to a server (e.g. Firebase Auth + Firestore, Supabase) and check roles there.
  - The default admin code above is in this file and in the source. Change it on first sign-in.
  - Payments and the 88/7/5 split are a simulation. Real payouts need a licensed payment gateway (e.g. Razorpay Route)
    and identity checks for handymen.
  - Code studio JavaScript runs with full access to the app. Give admin access only to people you trust.
  - Translations (Kannada, Hindi) were written without a native-speaker review.


CUSTOMER RATINGS, BADGES AND HANDYMAN BONUSES (added)
- After a real completed booking, the customer can submit one 1–5 star rating and an optional comment.
- Handyman reviews and average rating appear in the handyman dashboard/profile. Ratings are linked to completed bookings.
- Badge eligibility requires an average rating strictly above 3.5 stars: Certified at 16 jobs, Silver at 30 jobs, Gold at 50 jobs.
- Milestone bonus schedule: 15 jobs ₹100; 25 ₹110; 35 ₹120; 45 ₹130; 50 ₹140; 65 ₹150; 75 ₹160; 85 ₹170; 95 ₹180; 100 ₹1,000. Each milestone is credited once to the handyman's in-app reward balance.
- This build still uses browser localStorage for bookings, reviews and balances. It is a front-end demo, not a secure multi-device payout system. Before public launch, move ratings, job counts and reward ledger to a trusted backend and verify completed jobs server-side. Actual cash transfers require a payment/payout provider.
