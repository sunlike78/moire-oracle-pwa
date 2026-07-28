# MOIRÉ release QA

Last full local run: 2026-07-28, clean and deterministic-fixture origins,
mobile browsers, final `v8` service worker.

## First-run story and onboarding

- A state with no `onboarding` record migrates to an incomplete onboarding and
  opens the prologue automatically after the first page paint.
- Step 1 states the purpose before any internal vocabulary: choices are recorded
  before the event, the player returns to ordinary life, and exact / near / miss
  are all retained.
- The trial sigil path was completed end-to-end. Choosing `Разлом` displayed
  `Разлом выбран в 16:41`, enabled the seal action and carried the identical
  symbol and label into the proof screen.
- Neither first route is preselected. Choosing `quick` changed the final promise
  to the three-minute Echo and launched the real ritual at step 1. Choosing
  `walk` changed the final promise to three signs plus a nearby point, opened the
  Threshold view and focused the intention input.
- Completion persisted `completed`, timestamp, chosen sigil and chosen path.
  Reload did not replay onboarding.
- Skip persisted completion without inventing a sigil or path. The MOIRÉ logo
  opens a plain-language explanation and can replay a reset prologue at any time.
- The background app is inert while onboarding is open. Progress focus moves to
  the active article rather than creating a false selected state on the first
  button.
- `393 × 852` fits the complete first screen and CTA (`bottom=820`) with zero
  body overflow. `320 × 568` remains vertically scrollable with zero body
  overflow; all visible onboarding controls are named and at least `44 × 44`.
- Forced-network-offline reload restored the first-run prologue from the `v8`
  app shell with the correct title and zero console warnings or errors.

## Clean-install and layout

- Fresh storage starts with sound enabled, no profile, no daily forecast, no Chronicle
  entries and no active Threshold.
- `393 × 852` and `320 × 568` render without body-level horizontal overflow.
- On `320 × 568`, the sealed Threshold search CTA is fully above the fold
  (`top=407`, `bottom=465` in the final clean run).
- The bottom navigation remains pinned to the viewport on the narrow layout.
- Every visible interactive control in the measured mobile state is at least
  `44 × 44` CSS px.
- Final mobile route state has zero unnamed visible buttons, links, textboxes
  or checkboxes and zero visible controls below `44 × 44` CSS px.
- HTML has 161 unique IDs, zero duplicate IDs and zero missing
  `for` / `aria-labelledby` / `aria-describedby` references.

## Sound

- Sound is visibly and internally enabled by default.
- A real trusted pointer gesture starts the embedded Suno loop:
  `ambientStarted=true`, `paused=false`, `readyState=4`, `volume=0.5`.
- The sound control has explicit `🔊 ЗВУК` / `🔇 ВЫКЛ` states and accessible labels.
- Full reset returns to sound-on and immediately restarts the real MP3 when the
  browser permits it; the final reset probe returned `paused=false`.
- If media playback is unavailable, the Web Audio procedural layer remains the
  fallback.

## Daily ritual and return loop

- Two separate 200 ms taps do not accumulate into a valid hold:
  `holdMs=0`, `is-complete=false`, step 3 remains closed.
- A continuous hold completed at `1801 ms` and opened step 3.
- Programmatic/assistive button activation has an equivalent accessible path
  with `holdMs=1800`.
- The first Echo now matures after three minutes instead of eighteen.
- An unlocked Echo stored under the previous calendar day remains discoverable
  after midnight, opens, closes and writes the correct old-day Chronicle ID.
- A spring-DST three-day fixture returns streak `3`; streak arithmetic uses
  calendar ordinals rather than 24-hour millisecond gaps.
- A midnight refresh is scheduled for `00:00:02` local time.
- Daily Echo IDs now use six hex characters instead of a 1,000-value namespace.

## Sealed Expedition

- Clean form path passes: intention, radius, tone, safety acknowledgement,
  deterministic seal, three precommitted signs and one anti-sign.
- Sealed state survives reload with the identical seal, signs, intention, tone
  and radius.
- The primary map CTA sits before the radar visualization.
- A home Threshold is always available without GPS; it goes directly to the
  arrival/review stage and never creates a map link.
- GPS denial, timeout, no-POI and network failure keep the seal and reveal inline
  actions for wider search or the home Threshold.
- The measured no-GPS fallback returned in `4010 ms`.
- A deterministic mocked city success path selected a named OSM place, produced
  a valid map URL and survived reload at `status=revealed`.
- A revealed city point now produces three independent destinations:
  Apple Maps walking directions, Google Maps walking directions and an exact
  OpenStreetMap marker. The Apple action was opened end-to-end and resolved to
  Apple Maps walking directions for the fixture coordinate.
- Route opening persists the provider and start time. Returning from Maps keeps
  the same place and changes the live Reality channel to a route-return message.
- At `320 × 568`, the route panel is 292px wide, the primary Apple action is
  `258.7 × 73.2`, and both alternative map actions are `125.3 × 55`.
- A near-place GPS fixture advanced to `status=arrived`.
- Outcome and note survive reload before reward; the completion button restores
  enabled with the chosen outcome visibly selected.
- Completion writes a unique `Π-XXXXXXX` fragment, exact/near/miss, one personal
  detail and the immutable expedition manifest into the Chronicle.
- Completed state and fragment survive reload.
- Creating a new Threshold clears the old place name, map link and map state
  while preserving the old Chronicle entry.
- The Chronicle renders a persistent seven-Threshold constellation. The clean
  first completion showed `1/7`, one lit node and “Ещё 6”.
- A completed Threshold changes the next daily seal. The test pair was
  `cfc0a02796cf` with the fragment versus `c0988962f984` without it.
- The next forecast visibly quoted the saved personal detail.

## Profile regeneration

- Updating name, birth date and birth time changed the tested daily seal from
  `806ff7e9c31c…` to `a9700d11be8b…`.
- The forecast title changed, revision advanced `1 → 2`, and the existing loop
  was reset to `null`.
- Current time phase remains part of the personal key even when birth time exists.
- A strong forecast window is generated in the future; late-night forecasts move
  the window to tomorrow morning.

## Storage, privacy and service worker

- Active Threshold state is saved to both local storage and the IndexedDB
  protective mirror at every meaningful stage.
- Full reset removes the primary record and vault snapshot, clears the active
  in-memory Threshold, resets the UI and leaves no coordinate-bearing cache URL.
- Final reset probe: `local=null`, `vault=null`, `active=null`, `currentSeal=""`,
  zero external or coordinate URLs.
- `moire-oracle-v8` registers on a cold load without waiting for a missed
  `window.load` event.
- Its app shell contains exactly eight same-origin resources.
- The 1.25 MiB audio and unused 2.50 MiB 1024px image are not precached.
- A direct cross-origin Nominatim request did not enter Cache Storage.
- Forced-network-offline reload succeeded from the final `v8` shell with zero
  console errors.

## Live Reality channel and notifications

- The top action is a familiar `🔔` with an accessible state label; it is amber
  only when system notification permission is actually granted.
- First load, return after a pause, active Echo, mature Echo, revealed route,
  return from Maps, arrival, completion, online and offline states have separate
  deterministic phrase banks.
- A mature Echo changes the persistent Reality channel, the Today navigation
  label and the unread badge cue. The live signal is marked once per Echo so two
  adjacent timers cannot emit the same transition twice.
- Notification defaults are enabled, but the operating-system prompt is requested
  only from the explicit **Разрешить сигналы** user gesture.
- Capability probing confirmed `Notification`, service workers and
  `ServiceWorkerRegistration.showNotification` on the Chromium test page.
- A denied-permission profile renders the blocked state correctly and leaves all
  in-app signals operational. The `320 × 568` signal sheet has no body overflow
  and keeps its close control at `44 × 44`.
- The service worker parses Web Push payloads, shows a tagged notification and
  focuses or opens the matching `?signal=echo` / `?signal=threshold` route on tap.
- The click target resolves from the service-worker scope, preserving the
  `/moire-oracle-pwa/` GitHub Pages path instead of falling back to the domain root.
- OS notification acceptance and banner presentation remain an iPhone device
  acceptance test; the automation browser does not expose its permission chrome.
- Closed-app background delivery is not claimed: the static GitHub Pages build
  still needs an authenticated external subscription relay and push sender.

## Static checks

- `node --check app.js` passes.
- `node --check sw.js` passes.
- `git diff --check` passes.
- Manifest JSON parses and includes 192px, 512px and maskable icons.
- Open Graph URL and image are absolute production URLs.

## External dependency boundary

Public OpenStreetMap services can be unavailable or rate-limited. The product
does not claim that an OSM object or route is verified safe. It shows straight-line
distance, requires the player to check access and offers an offline home route.
The final regression uses a deterministic city fixture for the success state and
separately verifies the real network failure/fallback path; third-party uptime is
not treated as a release invariant.
