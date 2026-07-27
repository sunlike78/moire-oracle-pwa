# MOIRÉ

MOIRÉ is an iPhone-first progressive web app prototype: a personal probability
oracle with daily rituals, transparent `PATTERN / MYTH / CHANCE` labels, and a
safe nearby-place experiment powered by public OpenStreetMap points of interest.

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

Profile, forecasts, sound preference, and chronicle entries stay in local browser
storage. Exact coordinates are used only in the browser while selecting a public
nearby place and are never sent to an application server. OpenStreetMap data is
queried through a public Overpass endpoint.

## Safety and intent

MOIRÉ is an entertainment and attention experiment. It does not predict facts
and must not be used for health, financial, relationship, or safety decisions.
The nearby-place mode only proposes named public POIs and still requires the user
to inspect the route and surroundings. It never justifies trespassing or entering
unsafe places.
