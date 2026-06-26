# HANDOFF — Brand rebrand of the V8 questionnaire → fresh-eyes review → go-live

**Written:** 2026-06-26. **Branch:** `brand-alignment` (PR #1). **Last commit:** `1c9d177` (V3.2).
**This doc is self-contained.** A fresh session should be able to pick up with zero other context.
Companion docs: `CONTEXT.md` (the canonical V8 reference, pre-rebrand) and the memory file
`v8-brand-alignment.md`.

---

## 0. PASTE THIS TO START THE NEXT SESSION

> I'm continuing the brand-alignment rebrand of the V8 chat questionnaire (branch `brand-alignment`,
> repo `aa_questionnaire_v8_chat`). Read `HANDOFF_REBRAND_TO_LIVE.md` first — it's the full handoff.
>
> The rebrand is functionally done (V3.2): the chat now lives inside one continuous dark cinematic
> world (the site's atmosphere), with in-world moments, a per-phase evolving sea, a dark reveal, the
> Calendly CTA wired, and a full mobile/iOS pass. It's on the Vercel preview and 43 tests pass.
>
> Your job: go back to my ORIGINAL ask — "synthesise the new site + branding into the questionnaire" —
> and **re-review the WHOLE thing with completely fresh eyes** (desktop AND mobile), tidy up anything
> loose, and push it to be **as WOW as it can possibly be** before I show Saverio. Walk the full
> journey yourself with Playwright, embody it, be your own harshest critic. Then, when it's genuinely
> ready, **push it live** (prod = https://aa-questionnaire-v8.vercel.app) — but FIRST confirm the
> revert path works (the pre-rebrand build is backed up at git tag `pre-rebrand-v8`, and Vercel Instant
> Rollback is available). Do not break the live questionnaire. Interview me only if you hit a real fork;
> otherwise drive.

---

## 1. THE MISSION (original ask, in Kai's words)

Original: *"Take key styling elements — images and fonts — from the brand book and apply them to the
questionnaire so it's a clear extension of the new website, while keeping the Claude-session chat feel.
Do it safely (branch → preview, never touch prod until merged)."*

It evolved through **three rounds of "this still feels bolted on / disparate / not one ecosystem"**
into the real brief: **don't paint brand assets onto the chat — make the chat LIVE INSIDE the brand's
continuous cinematic atmosphere.** The chat form factor stays CORE (non-negotiable). That is the bar
the next review must hold the whole experience against: *does it feel like one ecosystem, the literal
next screen of atelierandavenue.ai, or like a quiz with brand stickers on it?*

**Next step (this handoff's task):** fresh-eyes re-review of the synthesis, tidy + WOW polish, then go
live with a guaranteed revert.

---

## 2. WHERE IT IS NOW (what's built — V1 → V3.2)

The chat is unchanged in STRUCTURE (streaming, caret, options, scoring, gate, reveal, PDF) but now
renders inside a dark world instead of flat cream.

**V3 — the continuous cinematic world (commit f9ab4eb):**
- The chat sits on a **continuous dark atmosphere** (the site's darkened/blurred archway photo), light
  type. Tokens flipped light-on-dark in `index.html` + `reveal/index.html` (`--ink`→cream `#f3ead9`,
  `--paper`→dark `#0b0805`, `--gold` `#cda86f`).
- Atmosphere = fixed image layer(s) + `body::after` scrim/vignette + `.atmos-grain`.
- The old separate **hero takeover and full-screen sea interstitials are DELETED**. Pacing beats are
  now **in-world MOMENTS** (`showMoment()` + `body.is-moment`): the atmosphere swells forward into
  focus + light, the conversation recedes, a held serif line lands, then it settles back.
- The **reveal is the same world deepening** (not a separate finale): reveal tokens light-on-dark, the
  quote peak brings the world forward (`body.peak-forward` on `card.dataset.peak`), the close stays
  quiet so its cream-pill CTA is crisp.
- **PDF stays the LIGHT printed report** (a leave-behind belongs on paper). `design_tokens.test.js`
  is intentionally decoupled (guards the PDF's light palette directly).

**V3.1 (commit 910dd64):**
- **Demo reveal now loads on the deployed env**: added a read-only `?demo=<key>` branch to
  `api/v8/reveal.js` (gated to the 9 demo keys; no token, no Turnstile, no Brevo/email). The reveal
  client `loadDemo()` GETs it instead of `POST /api/v8/submit` (which blocked on Vercel via Turnstile
  and had email side effects). The `.loading` overlay fixed cream→dark (that was the white screen).
- **Domain-map tiles** retuned for the dark world (were invisible muted on dark; now legible
  muted-light, gold accent on the current pillar).
- **Per-phase atmosphere (the sea evolving)** — two crossfading `.atmos` layers + `setAtmosphere()`
  hooked into `renderPillar`. The world moves through the sea's weather:
  `hero-archway` (open / Role / Channel Context) → `fog-on-sea` (Visibility) → `sea-storm` (Velocity)
  → `quiet-after-storm` (Coherence) → `sunny-sea` (Leverage) → `hero-archway` (reveal bookend). Moments
  bring the *current* phase forward.

**V3.2 (commit 1c9d177) — booking CTA + mobile/iOS pass:**
- **Booking CTA bulletproof**: close-card `calendarUrl` only honours a context/env override if it's a
  valid `https://` URL, else falls back to `DEFAULT_CALENDAR_URL` =
  `https://calendly.com/atelier-and-avenue-saverio-bianchi/atelier-and-avenue-intro-20min`.
- **Mobile/iOS**: safe-area insets on reveal chrome (progress clears the notch; advance button + dense
  copy clear the home indicator); `@media (hover:none) and (pointer:coarse)` resets sticky `:hover`
  states + drops the `↵` glyph on touch; **dense reveal cards** — the advance button was absolute-pinned
  to the scrolling content end (last line tucked under it on a phone) → now `position: sticky` to the
  visible bottom so copy scrolls cleanly above it; mobile atmosphere gets more bleed (`inset: -9%`) +
  lighter blur so the iOS address bar show/hide doesn't reveal an edge.

**Status:** 43 tests green. On the preview, looks great on desktop; mobile pass applied by iOS
best-practice (NOTE: emulated in Chromium — the touch-only/safe-area rules can't be seen firing locally;
the real iPhone is ground truth — Kai to confirm).

---

## 3. FILE MAP & KEY CODE LOCATIONS

Single-file front end, no build pipeline. Vercel serverless API. Plain Node tests.

| File | What |
| --- | --- |
| `index.html` | The whole questionnaire (chat). `:root` flipped tokens; `.atmos` layers + `body::after` scrim + `.atmos-grain`; `showMoment()`; `setAtmosphere()` + `PHASE_ATMOS` map (search these); `renderPillar` (atmosphere hook); the touch `@media (hover:none)` block + mobile `.atmos` block near `.atmos-grain`; `renderDomainMap` + `.domain-card` styles. |
| `reveal/index.html` | The Stories-style reveal. Flipped tokens; `body::before` archway + `body::after`; `render()` toggles `body.peak-forward` on `card.dataset.peak`; `loadDemo()` (GETs `?demo=`); `loadToken()`; `.loading` overlay (dark); `.cta` cream pill (text `#22211f`); `.card` / `.card-inner` / `.card-advance` (mobile sticky); safe-area on `.progress`/`.card-advance`/`.hint`; the `@media (max-width:680px)` + `@media (hover:none)` blocks. |
| `api/v8/reveal.js` | GET. `?token=` (real) and the new `?demo=<key>` (read-only canned cards). |
| `api/v8/submit.js` | POST. Real flow: Turnstile → score → sign token → Brevo + email. Demo does NOT use this. |
| `api/_lib/profile.js` | `deriveProfile`, `deriveRevealInsights`, `sanitiseAnswers`, `deriveActionPlan`; `DEFAULT_CALENDAR_URL`; the close-card `calendarUrl` https-guard. |
| `api/_lib/demo_scenarios.js` | The 9 `DEMO_SCENARIOS` (canned answer sets). |
| `api/_lib/reveal_copy.js` | All reveal card copy (persona lines, hurdles, quotes, closes). |
| `api/_lib/design_tokens.js` + `api/v8/design_tokens.test.js` | The PDF's LIGHT palette (decoupled from the dark reveal — do not "re-sync"). |
| `api/_lib/pdf_template.js` + `pdf_assets/` | The 5-page Chromium-rendered PDF (light report). |
| `assets/img/` | `hero-archway.jpg`, `fog-on-sea.jpg`, `sea-storm.jpg`, `quiet-after-storm.jpg`, `sunny-sea.jpg` (+ unused: marble-sphere, colonnade, cities, earth — fine to leave). Reveal reads archway from `../assets/img/`. |
| `assets/fonts/`, `reveal/fonts/`, `api/_lib/pdf_assets/fonts/` | Self-hosted Instrument Serif + Instrument Sans. |
| `scripts/dev_server.mjs` | Local dev server (port **4870**), serves static + the API routes. |
| `scripts/production_smoke.mjs` | Prod smoke test — run after go-live. |
| `scripts/render_pdfs.mjs` | Render persona PDFs locally. |

**Type system (verified against the live site):** Instrument **Serif** = headings / question stems /
display / the one italic emphasis phrase ONLY. Instrument **Sans** = body / options / UI / eyebrows.
Eyebrows = Sans 14px / 0.14em / weight 400 / uppercase. Do NOT make body serif.

**The 9 demo personas** (bucket × hurdle): `c-vi` Dead Reckoner · `c-ve` Sole Hand · `c-co` Patchwork
Crew · `t-vi` Blind Sprinter · `t-ve` Late Caller · `t-co` Splitting Pack · `s-vi` Flagship on Faith ·
`s-ve` Lagging Tanker · `s-co` Scattered Fleet.

---

## 4. COMMANDS (copy-paste)

```bash
cd /Users/kaipage/Desktop/Projects/AA/aa_questionnaire_v8_chat

# Dev server (port 4870). Restart it after editing any api/ file (it caches modules).
node scripts/dev_server.mjs            # questionnaire: http://localhost:4870/
                                       # reveal demo:   http://localhost:4870/reveal/?demo=t-ve
                                       # gate (skip to form): http://localhost:4870/?demo=t-ve

# Tests (must stay green)
node --test api/**/*.test.js

# Get the latest preview URL after a push to brand-alignment (repo is public → GitHub Deployments build)
HEAD=$(git rev-parse HEAD)
gh api "repos/kaipage-ltd/aa-questionnaire-v8/deployments?sha=$HEAD&per_page=1" --jq '.[0].id' \
 | xargs -I{} gh api "repos/kaipage-ltd/aa-questionnaire-v8/deployments/{}/statuses" \
 --jq '.[0] | {state, environment_url}'
# (Wait ~50s after push; state goes success with the environment_url.)
```

**Preview caveat:** preview URLs (`aa-questionnaire-v8-XXXX-kaipage-7741s-projects.vercel.app`) are behind
**Vercel SSO / Deployment Protection** — Kai opens them logged into Vercel. To share with Saverio: Vercel
→ project → Settings → Deployment Protection → Vercel Authentication → set to *Production only* (or off).
The local `vercel` CLI account is personal and lacks the atelier-and-avenue team — use the GitHub→Vercel
push path, not the CLI.

**Playwright review:** drive the dev server. For the reveal, cards mount async — wait for
`document.querySelectorAll('.card').length>=8`, then `go(n)` (global) to jump cards (0=turn 1=number
2=shape 3=hurdle 4=quote 5=cost 6=firstMove 7=close). For a moment, call `showMoment({eyebrow,line,
emphasis,sub,dwell})`. Mobile: `browser_resize` 390×844 (iPhone 13). Touch-only/safe-area CSS won't fire
in Chromium emulation — verify those by reading the CSS, confirm on the real device.

---

## 5. THE NEXT TASK — fresh-eyes WOW review + tidy

Hold everything to the bar in §1: **one ecosystem, not stickers.** Be your own harshest critic.

**A. Walk the full journey, slowly, twice (desktop then mobile 390×844):**
1. Opening (in-world title) → does it feel like you stepped INTO the site, or onto a quiz?
2. Q-flow + options + caret/streaming → is the chat soul intact AND native to the world?
3. Each pillar phase → does the sea actually *evolve* (archway→fog→storm→quiet→sunny)? Is each
   crossfade a smooth swell, not a cut? Does each phase feel motivated, not random?
4. The 3 moments → do they land as intensifications of the SAME world (swell forward + settle), with
   no app-switch seam? Is the held line the right weight?
5. The gate → does it read as the world holding its breath before the reveal?
6. The reveal (run several of the 9 personas) → turn → number → shape → hurdle → quote-peak (world
   forward) → cost → firstMove → close. Legible? The quote peak gorgeous? The close CTA crisp and
   obviously the next step? The bars/numbers clean?
7. The booking CTA → tap it; it must open the Calendly link.

**B. Tidy / WOW pass — likely candidates (judge, don't assume):**
- Motion polish (Emil Kowalski principles already in: `--ease-out cubic-bezier(0.23,1,0.32,1)`,
  transform/opacity only, blur-bridged crossfades, reduce-don't-eliminate). Look for any jump, any
  abrupt token, any moment that under- or over-stays (`dwell`).
- Seam-hunting: anywhere the chat→moment→reveal feels like two apps. The whole point is no seam.
- Type rhythm: heading vs body sizes, eyebrow tracking, the muted-stone body feel from the site.
- The reveal's dense cards (cost, close) on small screens — already sticky-button fixed; re-verify.
- Per-screen mobile: the opening title wrap at 360–390, tap targets, the atmosphere not jumping.
- Anything that reads as "AI-quiz" rather than "atelier diagnostic."

**C. Run the 9 personas** through the reveal (and spot-check PDFs via `scripts/render_pdfs.mjs`) to be
sure no persona's copy breaks the dark layout. (Prior QA bar: every measure ≥9/10 — see
`REVEAL_QA_SCORECARD.md`. Re-apply that lens in the dark world.)

**D. Keep `node --test` green.** Commit polish to `brand-alignment` with clear messages.

---

## 6. GO-LIVE — procedure + GUARANTEED revert

Only after §5 is genuinely WOW. **Prod = https://aa-questionnaire-v8.vercel.app.**

### Revert safety (already set up)
- **Git tag `pre-rebrand-v8`** = the exact pre-rebrand live build (commit `95aa036`), pushed to origin.
  This is the permanent revert point. (`origin/main` is also still `95aa036` until you merge.)
- **Vercel Instant Rollback**: the current live deployment stays in Vercel's history — you can promote
  it back to production from the dashboard in seconds, no git needed. This is the fastest revert.

### MUST-VERIFY before merging (don't assume)
1. **Which Vercel project serves `aa-questionnaire-v8.vercel.app`, and is it auto-deploying GitHub
   `main`?** The previews we built run under a personal-account project (`kaipage-7741s-projects`);
   prod is the atelier-and-avenue team project. Confirm the prod project's connected branch + account
   so the merge actually deploys to prod (and you're not surprised).
2. **Prod is NOT behind Deployment Protection** (it's the public live questionnaire). Confirm.
3. **Env vars on prod**: `JWT_SECRET`, Turnstile keys, Brevo keys present (real flow). The booking link
   now self-heals even if `PUBLIC_CALENDAR_URL` is stale.

### Merge (recommended: `--no-ff` so the revert is a clean `git revert`, no force-push)
```bash
git checkout main
git merge --no-ff brand-alignment -m "Merge brand-alignment: the cinematic-world rebrand of V8"
git push origin main                  # triggers the prod deploy (if main is the prod branch)
# watch the deploy, then:
node scripts/production_smoke.mjs      # or hit the live URL + /reveal/?demo=t-ve
```

### If anything is wrong on live → revert (pick one)
```bash
# FASTEST: Vercel dashboard → Deployments → the pre-rebrand deployment → Promote to Production.

# GIT (clean, because we merged --no-ff):
git checkout main
git revert -m 1 HEAD                   # reverts the merge commit
git push origin main                   # redeploys the pre-rebrand state

# NUCLEAR (only if needed): reset main back to the tagged pre-rebrand build
git reset --hard pre-rebrand-v8 && git push --force-with-lease origin main
```

---

## 7. REJECTED — do NOT re-propose

- Restructuring the chat into full-viewport "site sections" (the chat form factor stays CORE).
- Surface-matching only (swap fonts/colour + a hero image + sea interstitials on top) — that's the
  "bolted-on / disparate" failure that took 3 rounds to escape.
- Separate set-piece SCREENS (a hero takeover, full-screen sea interstitials as app-switch moments) —
  folded into the one continuous world as in-world moments.
- Making the reveal/PDF palettes match — they intentionally diverge (reveal = dark world, PDF = light
  printed report).
- Body text in serif (the live site uses Sans for body; serif is headings + the one italic phrase).

## 8. OPEN FLAGS / nice-to-haves (not blockers)
- Real-iPhone-13 confirmation of the mobile pass (touch/safe-area can't be seen in Chromium emulation).
- Possible polish: a more prominent per-pillar section eyebrow; deeper muted-stone on the quiz body;
  whether to carry the world onto the PDF cover (currently the PDF stays a clean light report).
- The privacy notice may need a "company name" field (flagged in v8_chat_state memory).
- Confirm the prod Vercel project/account before go-live (see §6 MUST-VERIFY #1).
