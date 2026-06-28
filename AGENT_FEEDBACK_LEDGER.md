# Agent Feedback Ledger

Purpose: preserve Kai's feedback across compacted sessions so future agents do not overwrite it by accident.

Use this file before making reveal, questionnaire, PDF, email, security or deployment recommendations.

## Conflict protocol

- Treat this ledger as durable product feedback, not a one-off chat note.
- If a new suggestion conflicts with this ledger, flag the conflict explicitly before implementing.
- If Kai gives a newer direct instruction, follow the newer instruction, but name which older feedback it supersedes.
- Do not silently remove conversion, email, Brevo, Calendly or reveal behavior in the name of polish or security.
- If a security improvement could break an existing workflow, preserve the workflow and present the safer alternative as a decision.

## Working style feedback

- Do original thinking before building, especially when Kai says something still does not feel valuable enough.
- Do not mechanically execute a prior plan if screenshots or new feedback show the result is still weak.
- Use the project files to understand the scoring and reveal system before rewriting reveal logic.
- Ask Kai focused questions when there is a real fork or conflict.
- Wider research is allowed when it helps taste, conversion, copy, sequencing or security.
- If Kai asks for implementation, keep going through implementation, verification and a clear report.

## Current north star

The reveal must be exceptionally valuable, easy to understand, cinematic, climactic and conversion-driving.

The conversion is booking a working session with Saverio / our CEO. The reveal should give the respondent a useful read, then make the call feel like the obvious next step.

The questionnaire data is valuable. The reveal must translate that data into a sharp read, not just show scores or generic advice.

## Non-negotiables

- Keep the existing background images and general A+A branding.
- Keep the 8-card reveal spine: `turn`, `number`, `shape`, `hurdle`, `quote`, `cost`, `firstMove`, `close`.
- Keep Instrument Serif / Instrument Sans and the near-monochrome brand language.
- Keep the reveal low cognitive load. One dominant idea must land per slide.
- Keep dense proof, tables, model detail and receipts inside quiet drawers.
- Keep copy at roughly 5th-7th grade reading level, with occasional A+A-tone lines for punch.
- Use plain-language meaning before internal pillar language.
- Reuse the four pillar symbols/glyphs throughout the reveal where they help comprehension.
- "Saverio" in user-facing copy becomes "our CEO", except URL slugs and operational identifiers.
- Do not use em dashes, Oxford commas, "honest/honestly" or banned voice words from the content-score skill.
- Do not add major front-end or UX changes during security work unless Kai explicitly asks.

## Reveal strategy

- The reveal should feel like a rising-tension film, not a report.
- It should follow a loose PAPS arc:
  - Problem
  - Agitation
  - Promise of a better future
  - Solution
- Each slide should loosely answer:
  - What happened?
  - So what?
  - What do we do now?
- Every slide should create forward motion toward the booking.
- Slides 6, 7 and 8 are the grand finale and must not feel verbose, flat or sleepy.
- The end should make the working session feel specific: bring one real decision, leave with the first rule to fix it.

## Data interpretation standard

The questions and scoring system are strong. The reveal must surface that value better.

Future work must not rely on generic profile copy alone. Use:

- profile/persona
- score band
- first constraint / lowest useful pillar
- selected answers
- answer patterns
- cost of delay
- first move
- ICP context

The output should feel like "you gave us data, we turned it into a useful read."

## ICP lens

Write and judge the reveal through multiple executive lenses:

- time-poor CEO with too many priorities
- thoughtful founder who wants the real operating diagnosis
- C-suite leader who needs clarity without jargon
- commercial operator who cares about speed and lost opportunity
- brand/marketing leader who cares about signal, coherence and momentum
- skeptical buyer who needs proof before booking a call

The reveal must work for all of them without becoming longer.

## Slide-specific feedback

### Slide 1: turn

- Start by making the respondent feel they are about to receive something valuable.
- The call should be foreshadowed early, but not pitched too soon.
- It should not feel like a generic welcome screen.

### Slide 2: number

- Do not say "Not a grade."
- The text under the number must appear quickly, not after a long count-up wait.
- Use "your operating system" rather than "the operating system" where relevant.
- Remove lines that say "the next card shows you..." if they feel mechanical.

### Slide 3: shape / benchmark

- Header must carry more: "Benchmark vs the best" or a stronger peer-benchmark equivalent.
- Use Instrument Serif for the big header.
- Show the respondent score over the filled line.
- Show the benchmark / strong-peer mark on the right as a marker.
- Do not use 100 as the benchmark because it looks silly.
- Make clear what the benchmark means: strong peers / advanced brands / where the operating system needs to hold.
- Use pillar symbols on every bar.
- Avoid redundant "Read the shape" / "What this means" labels when the Continue CTA already provides forward motion.

### Slide 4: hurdle / first constraint

- Remove "From your answers." It feels anxiety-provoking.
- Make the header punchier and simpler.
- Do not assume people understand "Coherence", "Velocity" or "Visibility" yet.
- State the so-what in business language first.
- Use the relevant pillar symbol.

### Slide 5: quote / proof

- "In your own words" was questioned. Do not keep a quote-only beat unless it earns its place.
- If using selected answer proof, make clear why that answer matters.
- Prefer surfacing valuable pattern data over replaying a quote for atmosphere only.

### Slide 6: cost

- The cost slide must make semantic sense. "What it costs you now" needs to match the actual content.
- This slide should agitate the problem without becoming a dense cost model.
- Keep the model optional in a drawer.

### Slide 7: first move

- This slide has been the weakest grand-finale slide.
- It must be specific, useful and tied to the respondent's actual constraint.
- It should answer: what do I bring, what will we map, what rule comes out of the call?
- Do not let it become generic "fix one thing" language without enough value.

### Slide 8: close

- This is currently one of the stronger slides, but can still be sharpened.
- It needs symbols and real impact.
- CTA should drive the booking clearly.
- The session should not feel like a pitch. It should feel like the next practical move.

## Copy scoring standard

Use the `aa-content-score` skill and Saverio's content-craft kit for reveal copy, email copy, PDF copy and major UI copy.

Every important element should score at least 8.5/10 before being treated as done.

Score at element level, not just slide level:

- eyebrow
- headline
- body
- drawer label
- drawer detail
- CTA
- proof line
- bar label
- quote/pattern line
- close line

If something scores below 8.5, iterate rather than rationalise it.

## Copy studio / stage 2

After the reveal implementation is stable and the copy is judged good enough, keep a local copy-review HTML document for iteration.

Desired studio behavior:

- left side: current implementation copy
- right side: editable/tweakable version
- support copy scoring and critique
- local/internal only
- not deployed publicly

The existing `reveal_copy_studio.html` is internal and should stay out of Vercel deployment.

## Security and customer data feedback

Security work should improve the app layer without breaking the product flow.

Preserve these unless Kai explicitly approves a change:

- Calendly name/email prefill from reveal data
- Brevo `AA_REVEAL_URL` and `AA_PDF_URL` contact attributes
- transactional email reveal/PDF params
- email-gated reveal/PDF link flow
- reveal/PDF token behavior

Security improvements that are acceptable without changing UX:

- sanitize provider errors
- avoid leaking internal provider IDs to the browser
- add timeouts around third-party calls
- keep no-store headers on sensitive API responses
- keep private/no-store PDF headers
- exclude internal docs from deployment
- add tests for failure behavior

If a security recommendation reduces conversion, breaks Brevo/Calendly automation or changes the customer journey, flag it as a decision rather than implementing it silently.

## Deployment feedback

- Keep the questionnaire live and stable.
- Do not push or deploy unless Kai explicitly asks in the current context.
- If the repo is public, be extra careful not to expose internal docs, audit notes, plans, templates or agent artifacts.
- Local/internal docs should be tracked only when useful for future agents and excluded from Vercel deployment.
- Production changes need tests first.

## Known implementation state as of 2026-06-28

- Reveal has already moved substantially toward the cinematic decision-leak arc.
- Latest security commit is local only unless pushed later.
- Internal docs are excluded from Vercel via `.vercelignore`.
- The booking/email data contract is intentionally preserved after Kai flagged that removing it could break core functionality.
