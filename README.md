# MOIRÉ

MOIRÉ is an iPhone-first progressive web app prototype: a personal probability
oracle with daily rituals, transparent `PATTERN / MYTH / CHANCE` labels, and a
safe nearby-place experiment powered by public OpenStreetMap points of interest.

The daily experience includes a return loop: the user chooses a sigil, receives
an attention mission, waits for a sealed Echo, records how it matched reality,
and earns a variable-rarity fragment in the Chronicle. The timer and soundtrack
survive reloads and are cached for offline use.

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

Profile, forecasts, sound preference, and chronicle entries stay on the device.
Every update is written to local storage and mirrored automatically in IndexedDB.
The profile sheet can also export an explicit JSON backup to Files/iCloud and
restore it later. This file is the reliable way to move state between Safari and
an installed Home Screen copy, which iOS can treat as separate storage contexts.
No browser-only scheme can guarantee recovery after iOS removes all site data, so
important chronicles should have an exported backup. The export is readable JSON,
not encrypted, and should be kept private because it contains the saved profile.

Coordinates are sent directly from the browser to public map services only while
selecting a nearby place; MOIRÉ does not persist them or send them to an
application server. The app uses a rate-limited OpenStreetMap Nominatim search
for parks, monuments, memorials, and public artwork, with public Overpass
instances as a fallback.

## Safety and intent

MOIRÉ is an entertainment and attention experiment. It does not predict facts
and must not be used for health, financial, relationship, or safety decisions.
The nearby-place mode only proposes named public POIs and still requires the user
to inspect the route and surroundings. It never justifies trespassing or entering
unsafe places.
