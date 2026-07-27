# MOIRÉ release QA

Last local run: 2026-07-28, clean origin, mobile viewport.

## Passed

- 393 × 852 and 320 × 700 layouts render without horizontal overflow.
- Every visible button has an accessible name; the profile and sound controls are
  at least 44 px high.
- Sound is enabled for a fresh profile. If the browser rejects the first media
  start, the procedural ambience starts immediately and the MP3 retries on the
  next user gesture.
- The sound control switches between `🔊 ЗВУК` and `🔇 ВЫКЛ`, and the preference
  survives reload.
- The complete daily ritual passes: energy choice, real 1.8-second hold, card
  choice, deterministic seal, and forecast reveal.
- The return loop passes: sigil, mission, persisted 18-minute timer, ready cue in
  the bottom navigation, Echo reveal, outcome, fragment reward, and Chronicle
  entry.
- A locked mission survives reload with the same copy and timestamp.
- A completed Echo adds a separate Chronicle record and contributes to exact /
  near / miss statistics.
- Changing the personal key changed the final tested seal from `A28DAB7F` to
  `146817E4`, rebuilt the forecast, reset the loop to `0/3`, and removed the old
  same-day Echo entry.
- At night the threshold action is disabled with a visible `07:00` reopening
  message while preserving the sealed intention.
- A daytime synthetic-coordinate map test returned ten named public places; the
  selected result was a named OpenStreetMap park with a valid map URL.
- Expanded Nominatim fallbacks returned named memorial / monument and artwork
  candidates when park results were intentionally skipped.
- Service worker `moire-oracle-v3` cached all ten app-shell resources, including
  the audio file.
- With the network forced offline, the app reloaded through the service worker
  and the cached 80-second MP3 remained fully decodable (`readyState=4`).
- No browser console errors or warnings remained after the clean run.

## Release audio

- Generated two original instrumental Suno v5.5 variants under the title
  `MOIRÉ — Шёпот вероятности`; generation reduced the account balance from
  7,734 to 7,724 credits.
- Selected source `eedb92d3-48a1-4c21-a3de-6ae61f3a957b` because its tested
  85-second windows had fewer high-energy onsets than the alternate render.
- The embedded loop is an 80.000-second, 48 kHz stereo MP3 at 128 kbps,
  normalized to -24.7 LUFS with 4.3 LU loudness range and -10.4 dBFS true peak.
- A five-second circular equal-power crossfade plus an 80 ms boundary taper
  produced a decoded boundary jump of zero in the final MP3.
- The final Suno loop replaced the synthetic test fixture before the repeated
  audio, service-worker, and offline checks.

## Known external dependency

- Public OpenStreetMap services can be unavailable or rate-limited. The app
  handles permission denial, empty results, timeouts, and retry states, but no
  test can guarantee third-party uptime.
