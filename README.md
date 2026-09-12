# Questbound — Life RPG

**TechTitan · Tech Zephyr 4.0 Web Hackathon · IIT Bhubaneswar**

Turn daily intentions into quests. Earn experience and gold, grow four character attributes, build a daily streak, and unlock rewards in an illustrated fantasy journal.

| Team member | Role |
| --- | --- |
| Gaurav Vyas | Team leader |
| Utkarsh Umang | Team member |
| Shivam Salve | Team member |

## Submission

**Release status:** Local app and deliverables are ready. The following public URLs are planned; hosting and GitHub publication await explicit owner approval. They are not yet judge-accessible.

- **Problem:** Life RPG, the official Round 1 Web Hackathon brief.
- **Planned live application:** https://questbound-techtitan.tender-elm-5517.chatgpt.site
- **Planned repository:** https://github.com/realgauravvyas/questbound-techtitan
- **Illustration video:** [TechTitan video](media/TechTitan_video_web.mp4)
- [System architecture and security decisions](docs/ARCHITECTURE.md)
- [Video narration and workflow](docs/DEMO-SCRIPT.md)

## What works

- Email/password signup and login, expiring server sessions, secure HTTPS cookies, account isolation.
- Create, read, update, delete or archive quests; optional due dates and attribute filters.
- Server-controlled XP and gold, nonlinear character leveling and a level-up celebration.
- Intellect, Strength, Spirit and Craft attribute progression.
- Consecutive-day activity streaks using the timezone captured at signup.
- Gold marketplace, permanent inventory, equippable badges and an unlockable night theme.
- Immutable completion history; refresh and login restore progress from the database.
- Responsive layout, native keyboard-operable dialogs, accessible form labels, focus rings and reduced-motion support.
- Preserved form input on network failure and explicit retry; no pretend offline success.

## Run locally

Prerequisites: **Node.js 22.13 or newer** (tested with Node.js 24), npm and Git. No paid API, AI key, external identity account or production database credential is needed for local execution.

```sh
git clone https://github.com/realgauravvyas/questbound-techtitan.git
cd questbound-techtitan
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_reflective_sandman.sql
npm start -- --port 5173
```

Until publication, extract the supplied source ZIP and begin the commands at npm ci from that folder. Open the local address printed by the server (normally http://127.0.0.1:5173). Create your own account. Run the migration once on a fresh local database; do not replay it on an existing database. Local SQLite data lives in `.wrangler/state`, which is excluded from Git.

`.env.example` explains the configuration. The app needs a `DB` D1 binding, supplied by the local runtime or hosting platform. It does **not** use a browser-only database or a hardcoded shared user.

For development, use `npm run dev` after initializing the database. For a direct build without a platform-specific npm launcher, use `node scripts/run-framework.mjs build`.

## Test

With the local server running:

```sh
node tests/api.test.mjs
node --experimental-strip-types --test tests/game.test.mjs
npx tsc --noEmit
```

API checks create synthetic test accounts and verify isolation, input validation, duplicate/concurrent completion, concurrent purchase, immutable rewards, insufficient funds, cross-origin rejection, logout and login persistence. Test passwords are demonstration-only. The UI has also been exercised using the browser test in `tests/browser-check.mjs`; install Playwright locally with npm install --no-save playwright and npx playwright install chromium to rerun it. PLAYWRIGHT_MODULE can optionally point to an existing Playwright installation.

## How the game works

| Effort | XP | Gold |
| --- | ---: | ---: |
| Small step | 25 | 10 |
| Steady effort | 50 | 20 |
| Brave challenge | 100 | 40 |

Moving from character level `L` to `L+1` takes **100 × L² additional XP**. The first level-up takes 100 XP; the next takes another 400 XP. Each attribute levels up every 100 XP earned in that category. Completing multiple quests on one calendar day earns one streak day.

The backend ignores client-supplied XP, gold and item prices. Each completion is unique per task. A purchase checks balance and records the debit in one SQL statement. The app is a personal accountability tool: it does not claim to independently verify that a user actually read, exercised or studied.

## Repository layout

```text
app/                   React interface, metadata and API routes
lib/game.ts            Progression and streak rules
lib/server.ts          Authentication, validation and state derivation
db/schema.ts           Relational schema
drizzle/               Versioned schema migrations
public/                Optimized original artwork and favicon
tests/                 API, game rule and browser checks
docs/                  Architecture, tradeoffs and demo script
media/                 Public illustration video
```

## Deployment

The app is prepared to run on a Cloudflare Worker with a managed D1 database through Sites. The build produces `dist/server/index.js`, client assets, and the logical database manifest. The production deployment applies the checked-in migrations. No database secrets or session tokens are committed.

The `.openai/hosting.json` project ID identifies the team's deployment. A fork should create its own deployment and database instead of attempting to publish to that ID. The standard build can also be adapted to an independently owned Cloudflare Worker and D1 binding.

## Scope and credits

This submission was built with AI coding assistance and original AI-generated fantasy artwork. Lucide supplies the interface icons; the build scaffold uses the included open-source packages and license files. The team should review the code and rehearse the architecture explanation before presenting.

Known MVP boundaries: no email verification/password recovery, no recurring-task scheduler or external activity verification, and no offline write queue. State queries currently read the user's complete history; pagination and aggregate caching would be needed at larger scale. The password hashing parameters and rate-limit tradeoffs are documented in the architecture notes. No claim of guaranteed qualification, winning, or measured productivity improvement is made.


