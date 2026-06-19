# Style Guide — PO-33 Sampler & Synth Primer

The whole project should look and feel like the **Teenage Engineering PO-33
K.O!**: an exposed black circuit board you operate, not a web page about one.
When in doubt, ask "would this help someone learn the real PO-33 control
layout?"

This guide covers both **visual design** and **code conventions**. Keep both
pages consistent with it.

---

## 1. Design principles

- **It's a device, not a document.** Controls are tactile: crisp borders, a
  hard bottom shadow that "depresses" on press, screen-printed labels.
- **One accent, used sparingly.** Signal orange marks what's *active / on /
  playing* and key PO-33 silkscreen labels. Most of the surrounding lesson UI is
  warm grey; the device itself is black with white/silver hardware controls.
- **The LCD is the only "screen."** Khaki-green with dark pixels; the only place
  the pixel font appears.
- **Technical, terse, lowercase.** Labels read like silkscreen: `Space Mono`,
  uppercase-tracked for headers, lowercase for buttons.
- **Restraint over skeuomorphism.** Subtle insets and shadows, not glossy
  bevels. Match complexity to need.

---

## 2. Color tokens

Defined in `:root` and **identical in both files**. Never hardcode a hex —
always use the variable.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#b4b1a6` | Page background (the table the device sits on) |
| `--board` | `#cbc8bd` | PCB faceplate / inset surfaces |
| `--board-hi` | `#dfdcd2` | Raised panels, cards, guide blocks |
| `--key` | `#eceae2` | Button / key top (light face) |
| `--key-lo` | `#dedbd1` | Button gradient bottom |
| `--ink` | `#1b1814` | Primary text (screenprint black) |
| `--ink-soft` | `#4f483f` | Secondary text, labels |
| `--signal` | `#e8521f` | **Accent** — active/on/playing, playhead, focus |
| `--lcd` | `#aebd5f` | LCD / waveform background (khaki) |
| `--lcd-ink` | `#222a0e` | LCD pixels / waveform stroke |
| `--metal` | `#2a261f` | Borders, knob/key outlines (1.5px) |
| `--line` | `rgba(27,24,20,.16)` | Hairlines |
| `--line-2` | `rgba(27,24,20,.30)` | Stronger hairlines, dashed wells |
| `--shadow` | `rgba(27,24,20,.30)` | The `0 2px 0` "depress" shadow |

**Active/on color is always `--signal`.** Lit/selected dark fills use `--metal`.

---

## 3. Typography

Three families, each with one job. Don't add more.

| Font | Role | Notes |
|------|------|-------|
| **Space Grotesk** | Display + body | Headlines, lesson prose. 400/500/700. |
| **Space Mono** | Labels, buttons, technical | Uppercase + `letter-spacing` for silkscreen labels; lowercase for button text. 400/700. |
| **Pixelify Sans** | **LCD only** | Numbers/readouts inside the khaki screen. Never outside it. |

Patterns:
- Section eyebrow / field label: Space Mono, ~9–11px, `font-weight:700`,
  `letter-spacing:.1–.2em`, `text-transform:uppercase`, `--ink-soft`.
- Button text: Space Mono, ~11–13px, `font-weight:700`, usually lowercase.
- Headline: Space Grotesk, `font-weight:700`, tight `letter-spacing:-.01–-.02em`.

---

## 4. Shape, depth, motion

- **Device silhouette:** the playable device uses a black rectangular board,
  top hanger, wide LCD, A/B knobs, `sound / pattern / bpm` row, 4x4 numbered
  matrix, and right-side `record / FX / play / write` action column.
- **Borders:** `1.5px solid var(--metal)` on lesson controls; PO-style hardware
  keys use dark switch outlines plus silver/white caps.
- **Radii:** hardware key caps 4–8px, panels 10–12px, the device shell ~10px.
- **Depth (the signature):** controls sit on a hard shadow and depress on press.
  ```css
  box-shadow: 0 2px 0 var(--shadow);          /* resting */
  /* :active */
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--shadow);            /* depressed */
  ```
  Larger pads use `0 3px 0`. Keys add an inner highlight:
  `inset 0 1px 0 rgba(255,255,255,.55)`.
- **PCB texture:** the device shell uses a faint dot-grid (via-holes) via a
  `::before` radial-gradient at low opacity, plus four corner "screws."
- **Motion is subtle and functional.** The step playhead, the LCD beat-bounce,
  a blinking record arm. Always honor:
  ```css
  @media (prefers-reduced-motion: reduce){ *{transition:none!important} /* + kill keyframes */ }
  ```

---

## 5. Component patterns

Reusable looks (class names vary slightly between pages — keep them aligned):

- **Hardware function/key buttons** (`.fn`, `.hw-fn`, `.pad`, `.kkey` inside the
  device): silver/white switch body, black circular center, orange outline for
  selected/on states. Keep the 4x4 + action-column layout.
- **Lesson/editor buttons** (`.btn`, `.mini`, `.util`, `.tab`): key gradient
  (`linear-gradient(var(--key),var(--key-lo))`), metal border, depress shadow.
  - **Selected / active:** fill `--metal` with `--key` text, **or** fill
    `--signal` with white for the primary/"on" state (play, active tab).
- **Step cell** (`.stp`, `.step`): tall thin cell; `.beat` (steps 1·5·9·13) gets
  a darker border; `.on` fills `--metal`; `.cur` (playhead) gets a signal ring
  `box-shadow:0 0 0 2px var(--signal),0 0 9px rgba(232,82,31,.6)`.
- **Pad** (`.pad`, `.fxpad`): in-device `.pad` means a PO-style sound key;
  standalone `.fxpad` remains a larger lesson/editor key. `.sel` = signal
  outline; `.holding` (FX) = signal fill + depressed.
- **Knob** (`.knob`): radial-gradient white cap, metal ring, a `.dial` child
  rotated by JS (`-135°…+135°` across the range). Rotary drag = vertical pointer
  movement.
- **LCD** (`.screen`/`.lcd`): `--lcd` bg, inset shadow, scanline `::after`
  (`repeating-linear-gradient`), Pixelify text in `--lcd-ink`.
- **Waveform well** (`.wave-wrap`): LCD-colored canvas; orange draggable trim
  handles; shaded out-of-trim regions.

**Beat markers:** in any 16-step grid, steps **1, 5, 9, 13** (0-indexed
0/4/8/12) are visually emphasized — that's the teaching cue for the four beats.

---

## 6. Interaction conventions

- **Press-and-hold** controls (FX pads, knobs): use Pointer Events,
  `setPointerCapture` on `pointerdown`, release on `pointerup`/`pointercancel`,
  plus a `document` `pointerup` fallback to clear any stuck "holding" state.
- **Required CSS on hold/drag controls** (or gestures break via text selection):
  ```css
  -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;
  touch-action:none;   /* on draggables: knobs, handles, fx pads */
  ```
- **Focus:** every control gets a visible focus ring:
  `outline:3px solid var(--signal); outline-offset:2px` via `:focus-visible`.
- **Keyboard support:** knobs and trim handles respond to arrow keys; the scale
  keyboard supports the home-row (`asdf…`) when toggled on.
- **Tap targets:** keep ≥ ~28px; the 16-step lanes use tall-thin cells so they
  stay tappable on a phone.

---

## 7. Audio/code conventions (so sound stays clean)

These are as much "house style" as the visuals — see `CLAUDE.md` for the full
architecture.

- **Always anti-click:** ramp gain from `~0.0001` up over a few ms and back to
  near-zero before `stop()`. No instant-on/off gains.
- **Lazy, gesture-unlocked AudioContext:** call `ac()` / `ensure()` at the top
  of every handler that makes sound.
- **Lookahead scheduler** for anything sequenced (don't drive audio off
  `setInterval`/`setTimeout` alone).
- **Master delay wet (`mWet`) stays 0** unless the echo FX opens it.
- **Reuse one mic stream** (`getMic()`); never `getUserMedia` per take.
- **No external audio files.** Generate buffers in code or record via mic.
- CSS lives in `<style>`, JS in one `<script>` at the end of the file; keep each
  page a single self-contained document.

---

## 8. Quick do / don't

**Do**
- Use the tokens; use the three fonts for their assigned roles.
- Make active/on states signal-orange; everything else grey + black.
- Give new controls the depress shadow, metal border, focus ring, and
  `user-select:none`.
- Mark beats 1·5·9·13 in any step grid.

**Don't**
- Hardcode colors, add a 4th font, or use Pixelify outside the LCD.
- Add glossy bevels, drop shadows with blur on controls, or decorative orange.
- Start/stop audio nodes at full gain.
- Break the single-file structure or add a build step without updating
  `CLAUDE.md`.
