# MOIRÉ

MOIRÉ is an iPhone-first observation game. It records choices and details before
an event, gives the player a short mission or an optional nearby walking point,
then saves an honest exact / near / miss result. Its fictional “weak interference
instrument” lore adds atmosphere without replacing the clear rules. Transparent
`PATTERN / MYTH / CHANCE` labels explain which effects come from psychology,
symbolic mythology or sealed randomness.

[Open the live app](https://sunlike78.github.io/moire-oracle-pwa/)

Every new or pre-onboarding player first sees a four-part interactive prologue.
It explains the purpose in plain language, records a trial sigil with the current
time, demonstrates why the result cannot be retrofitted, offers a five-minute or
walking first route, then defines Signal, Echo, Threshold and Fragment. Completing
the prologue launches the selected real route immediately. It can be skipped and
replayed later from the MOIRÉ logo.

The daily experience includes a return loop: the user chooses a sigil, receives
an attention mission, waits three minutes for a sealed Echo, records how it
matched reality, and earns a variable-rarity fragment in the Chronicle. An Echo
can be completed after midnight.

The core Threshold loop now persists every stage: the user seals three signs
before seeing a place, resumes the route after reload, confirms arrival, records
exact / near / miss plus one detail, and receives a unique `Π` fragment. Seven
completed Thresholds form a constellation, and the latest fragment and note
change the next daily forecast. A no-GPS home Threshold provides a full offline
fallback instead of a dead end.

The live Reality channel changes its language when the user opens a route,
returns from Maps, comes back after a pause, matures an Echo, loses connectivity,
arrives, or closes a loop. A persistent bell opens signal settings. Apple Maps is
the primary walking-route action, with Google Maps and OpenStreetMap as explicit
alternatives. Opening a route is recorded locally so returning to MOIRÉ resumes
the same sealed expedition.

## Run locally

Serve the directory over HTTP so the service worker and geolocation behavior
match production:

```powershell
python -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## Install on iPhone

1. Open the live GitHub Pages URL in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Launch MOIRÉ from the new icon.

On iOS/iPadOS 16.4 or later, launch the installed Home Screen app, tap the bell,
and choose **Разрешить сигналы**. The app never asks on first load: the operating
system permission appears only after that deliberate tap. While MOIRÉ is active,
the three-minute Echo and the twelve-minute open-Threshold reminder can show a
service-worker notification. The service worker also contains the standard Web
Push receive and notification-click handlers.

The current static GitHub Pages deployment has no subscription relay or push
sender. Consequently, an iPhone that has completely suspended or closed the app
cannot be woken by the local timers alone. Reliable closed-app delivery requires
connecting the existing service worker to an external Web Push application
server. The in-app Reality channel, return detection, route persistence, badge
state, and notifications while the app remains active do not depend on that
server.

Profile, forecasts, sound preference, and chronicle entries stay on the device.
Every update is written to local storage and mirrored automatically in IndexedDB.
The profile sheet can also export an explicit JSON backup to Files/iCloud and
restore it later. This file is the reliable way to move state between Safari and
an installed Home Screen copy, which iOS can treat as separate storage contexts.
No browser-only scheme can guarantee recovery after iOS removes all site data, so
important chronicles should have an exported backup. The export is readable JSON,
not encrypted, and should be kept private because it contains the saved profile.

Approximate coordinates are sent directly from the browser to public map
services while selecting a nearby place. The chosen destination is then stored
locally so the expedition can survive reload and return from Maps; it is never
sent to an MOIRÉ application server. The service worker caches same-origin app
resources only and never caches Nominatim or Overpass requests. Full reset
removes the local record and its IndexedDB mirror.

The embedded Suno soundtrack is enabled by default and begins after the first
browser-permitted gesture. It is loaded lazily rather than blocking installation;
the procedural Web Audio layer remains available when the MP3 is not cached.

## Safety and intent

MOIRÉ is an entertainment and attention experiment. It does not predict facts
and must not be used for health, financial, relationship, or safety decisions.
The nearby-place mode proposes named POIs but does not verify public access,
opening hours, walking routes, or safety. Straight-line distance is labeled as
such. The user must inspect the route and surroundings, travel only in daylight,
and stop whenever the place is closed, private, uncomfortable, or unsafe. A
destination is an invitation to notice the world, never an instruction to take
risk or trespass.
