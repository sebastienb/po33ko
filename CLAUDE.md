# PO-33 Sampler & Synth Primer — Project Guide

A two-page, browser-based learning toolkit that teaches the fundamentals of
sampling, sequencing, and synthesis, built around the look and workflow of the
**Teenage Engineering PO-33 K.O!** micro sampler. It starts as guided lessons
(page 1) and graduates to a full playable groovebox (page 2).

> This file is read automatically by Claude Code at the start of a session. It
> describes what the project is, how it's built, and the conventions to follow
> when extending it. Visual and code style rules live in `STYLE_GUIDE.md` —
> read that too before changing any UI.

---

## What this is

- **Audience:** someone learning music production / grooveboxes from zero.
- **Goal:** teach concepts by *doing* — everything makes sound in the browser.
- **Tech:** plain HTML + CSS + vanilla JS. **No build step, no framework, no
  package manager, no external audio assets.** Sound is generated live with the
  **Web Audio API**. The only network dependency is Google Fonts (loaded via
  `<link>`); the pages work offline if fonts are cached.
- **Distribution:** each page is a single self-contained `.html` file. Open in a
  browser and go.

## Files

| File | Role |
|------|------|
| `po33-primer.html` | **Page 1 — Lessons.** Guided, interactive primer. |
| `po33-studio.html` | **Page 2 — Studio.** Full playable instrument. |
| `CLAUDE.md` | This guide. |
| `STYLE_GUIDE.md` | Design tokens + visual/code conventions. |

The two pages link to each other via a shared nav header (relative `href`s), so
they must live in the **same folder** for navigation to work.

---

## Page 1 — `po33-primer.html` (Lessons)

A scrollable primer. Sections, in order:

1. **Device hero** — a faithful CSS recreation of the PO-33 that *is* a working
   3-lane (kick / snare / hat) 16-step sequencer. Draggable tempo & swing knobs,
   a pixel-LCD that animates on the beat, function keys that print hardware tips,
   and preset loaders: **Load beat** (classic), **AFD 91** (All Falls Down feel).
2. **01 Sampling** — record from mic or load built-in sounds; drag trim handles
   on a waveform; pitch slider; melodic keyboard.
3. **02 Scales & keys** — pick root + scale; in-scale keys light up; play with
   mouse/touch or the computer keyboard (the **asdf** toggle maps the home row).
4. **03 Punch-in FX** — an offline-rendered drum loop you mangle live with
   hold-to-apply pads: filter, gate, tape-stop, echo.
5. **04 Beat breakdowns** — All Falls Down / Through the Wire / Jesus Walks
   cards; each "load feel" button sets the device tempo + drum skeleton.
6. **05 Song mode** — chain patterns A/B/C into an arrangement.
7. **06 Glossary** and **07 Make your first track** (workflow recap).

## Page 2 — `po33-studio.html` (Studio)

A single device with a transport, three knobs (tempo / swing / vol), an LCD,
four mode tabs, and an always-on FX row. A contextual **"field notes"** panel
below the device swaps content per tab (theory + techniques).

Tabs:

- **SEQ** — 8 sound slots (pads), per-slot 16-step lane, per-slot tune,
  4 patterns (A–D) with **copy →** / **clear**.
- **KEYS** — selected slot becomes a scale-locked melodic keyboard (root + scale
  + asdf typing + octave shift). **Rec melody** records live, quantized to the
  step grid, into that pattern's melody lane.
- **SOUND** — per-slot editor. Sample slots: record mic / load blip / load bass,
  waveform + trim. Synth (`tone`) slots: waveform, cutoff, attack, release. Drum
  slots: tune + option to replace by recording. **Reset** restores the default.
- **SONG** — chain patterns A–D into an arrangement and play it back.
- **FX** (always visible) — hold to apply over the whole mix: filter, gate,
  echo, roll.

---

## How it works (audio architecture)

Both pages share the same core patterns. Read these before touching audio code.

### AudioContext is lazy + gesture-unlocked
- `ac()` creates/returns the `AudioContext` and calls `resume()`. Browsers block
  audio until a user gesture, so **every interactive handler calls `ac()`/
  `ensure()` first.** A global first-gesture listener and the "tap to enable
  sound" banner guarantee the unlock.
- Page 2 also has `ensure()`, which builds the master bus once.

### Voices are synthesized, not sampled
- Drums = oscillators + filtered noise bursts + gain envelopes
  (`vKick`, `vSnare`, `vHat`, `vClap`, `vTom` in the studio; `kick/snare/hat`
  in the primer).
- **Anti-click envelopes are mandatory.** Every voice ramps gain from ~0.0001
  up over a few ms and back down before `stop()`. Starting/stopping a node at
  full gain produces audible clicks/pops. Do not remove these.

### Lookahead scheduler ("A Tale of Two Clocks")
- A `setTimeout` loop (`LOOK`/`LOOKAHEAD` ≈ 25 ms) schedules notes ahead on the
  precise `audioContext.currentTime` clock (`AHEAD` ≈ 0.12 s). This gives tight
  timing that `setTimeout` alone can't.
- A `drawQueue` of `{step, time}` drives the UI playhead via `requestAnimationFrame`
  so visuals line up with audio.
- **Swing** delays odd-numbered steps by `swing%` of the step duration.

### Page 2 master bus + FX
Signal path: `voices → mFilter (lowpass) → mDrive (gain) → mGain (volume) →
destination`. A delay send runs `mDrive → mDelay → mWet → mGain`, with feedback
`mDelay → mFb → mDelay`.

- **`mWet` defaults to 0.** The echo FX opens `mWet` (+ a little `mFb`) on hold
  and closes them on release. ⚠️ *Known past bug:* if the delay output is wired
  straight to the mix, every sound gets a permanent slapback echo. The wet gate
  is the fix — keep it.
- **filter** sweeps `mFilter.frequency`; **gate** chops `mDrive.gain` with an
  interval; **roll** retriggers the selected slot at 1/16; all are hold-to-apply.

### Samples
- Built-ins are generated procedurally (`makeBlip`, `makeBass`) — no files.
- Mic samples: `getUserMedia` → `MediaRecorder` → `decodeAudioData` into an
  `AudioBuffer`. Playback via `BufferSource` with `playbackRate` (= pitch),
  `trimS/trimE` offsets, and an anti-click gain envelope.
- **One mic stream is acquired and reused** (`micStream` + `getMic()`) so the
  browser only prompts for permission once (important on `file://`).

### Data model (page 2)
```
slots[8] = { name, kind, tune, ...kindFields }
  kind: "kick"|"snare"|"hat"|"clap"|"tom"  (synth drums; tom is pitched)
        "tone"   → { wave, base, cutoff, atk, rel }   (synth osc voice)
        "sample" → { buffer, base, trimS, trimE }

patterns[4] = { grid:[8][16] booleans, melSlot:int, mel:[16] (semitone|null) }
curPat                       // active pattern index
playChain                    // null = loop curPat; else array of pattern indices
```
The scheduler reads `patterns[curPat]`; song mode advances `curPat` through the
chain at each bar boundary.

---

## Running & developing

- **Run:** open the `.html` file in a real browser (Chrome / Safari / Firefox).
  Double-click works for everything except mic recording quirks.
- **Mic recording** needs a real browser tab (not an in-app preview / iframe
  sandbox). On `file://` it works but may re-prompt; serving over `http`
  (`python3 -m http.server`) is cleaner if you iterate on sampling.
- **No build.** Edit the file, refresh the browser.
- **Validate JS after edits** (the script is one block near the end of each
  file):
  ```bash
  python3 -c "import re;open('/tmp/x.js','w').write(re.search(r'<script>(.*?)</script>',open('po33-studio.html').read(),re.S).group(1))" && node --check /tmp/x.js
  ```
- **Suggested git hygiene:** commit each feature separately. There's nothing to
  ignore except OS cruft (`.DS_Store`) and editor folders.

## Conventions

- Vanilla everything. No dependencies you have to install. If you add a library,
  prefer a single CDN `<link>`/`<script>` and document it here.
- Keep each page a **single self-contained file** (CSS in `<style>`, JS in one
  `<script>` at the end). This is a deliberate constraint — it keeps the pages
  shareable as one download.
- All theming through CSS custom properties (see `STYLE_GUIDE.md`). Don't
  hardcode colors.
- `"use strict";` at the top of each script. Terse, framework-free DOM code.
- No `localStorage`/`sessionStorage` is used today (the pages were built to run
  in sandboxes that block it). When opened as local files it *would* work, so
  persistence is a fair next feature — just gate it in a `try/catch`.

---

## Roadmap / good next features

Rough ideas, roughly ordered by value:

1. **Persistence** — save/load patterns & songs (localStorage, or export/import
   JSON). Foundation for everything else.
2. **Share via URL** — encode the kit + patterns + song into the hash so a link
   reproduces a track (solves the "my friend hears nothing / sees an empty kit"
   sharing problem).
3. **WAV export** — render the current pattern/song to a file via
   `OfflineAudioContext` and offer a download.
4. **More scales/modes** — Dorian, Phrygian, etc., in both the primer explorer
   and the studio KEYS tab (and tie the two together).
5. **Melodic step editor** — place/edit notes per step, not only live-record.
6. **Per-step velocity / accent / probability.**
7. **Drag-and-drop real audio import** into a slot.
8. **More FX** — reverb, bitcrush, a proper tape-stop on the master.
9. **Variable pattern length / time signatures.**
10. **Accessibility pass** — fuller ARIA, keyboard playability, reduced-motion
    audit.

## Gotchas (don't re-introduce these)

- Audio needs a user gesture — never expect sound on page load.
- Keep anti-click envelopes on every voice.
- Keep the delay wet send (`mWet`) gated to 0 by default.
- Reuse the single mic stream; don't call `getUserMedia` per recording.
- Keep `user-select:none` / `touch-action:none` on hold-and-drag controls, or
  press-and-hold gestures break (text selection hijacks the drag).
- Mic + sandboxed preview don't mix; test sampling in a real browser tab.
