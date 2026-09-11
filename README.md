# Button hover specimens

131 button hover mechanisms, one identical button. Same label, same 160 x 48 box, same 2px rule, black and white only. The only variable is what happens when the pointer arrives, and, for 117 of them, what the same mechanism does when the pointer goes down.

**[Live catalogue](https://jsabutis.github.io/button-interaction-specs/)**

No dependencies, no build step to view: open `index.html`. Every card has a `CSS` button, and pointer-driven cards a `JS` button, that shows that specimen's own markup and code, ready to copy.

Pure CSS where CSS can do it. One `pointermove` listener and a spring integrator where it cannot: pointer position, speed, entry edge, pressure and dwell are not expressible as a hover state.

A style catalogue, not a good-or-bad pattern set: nothing here is a recommendation, and several specimens are deliberately too much for real work.

`index.html` is generated. Edit `build.py` to add an effect, then `python3 build.py`. CSS effects live in `hover.css`; pointer-reactive ones live in `pointer.css` and `pointer.js`. The Google Fonts link needs network; everything else is local.

131 specimens in fourteen sections, in page order. **Pure CSS** (36): the response is the same wherever the pointer enters and however fast it moves. **Pointer-reactive** (36): the response depends on pointer position, speed or entry edge, so a hover state cannot express it. **Variable font** (14): Inter's `wght` and `opsz` axes, and per-letter transforms, driven by the pointer. **Hatching and halftone** (4): fills built from line and dot density. **Intent and prediction** (4): where the pointer is going. **Press, hold and release** (5), **Keyboard and focus** (3), **Shape morph** (5), **Physics beyond springs** (4), **Cursor** (3), **New CSS, no JavaScript** (6), **SVG filters** (3), **After the press** (4, click states rather than hovers), **Label content** (4). Sections are the `SECTIONS` table in `build.py`; adding one is a list and a row.

Verification harness: serve the folder, then a Playwright script per card records the rest state (inline styles, SVG attributes, computed box) before and after a synthetic hover, screenshots the held frame and the rest frame at 2x, and compares rest against the Invert card. Press, key, click and timing mechanisms need bespoke drives (`page.mouse.down`, `page.keyboard.press`), and a mid-state frame is captured by replacing `PFX[id].frame` with a no-op. Headless Chromium runs `requestAnimationFrame` near 120Hz, so frame-counted timings run twice as fast there as at 60Hz.

Each card carries two tagged lines: what the hover does and what the press does. `Hover all` holds every CSS hover; `Press all` holds every CSS press on top of it. Neither reaches the JavaScript specimens, which need a real pointer.

Each card has a `CSS` button; pointer-driven cards also have `JS`. The CSS view opens with the specimen's markup, since some need extra elements (an ink plate, an SVG border, the label split into letters); that markup is the only code here besides CSS and JavaScript.

## Base spec

- Label `BUTTON`, Inter 600 14px, letter-spacing 0.08em, uppercase. Inter is loaded as a variable font (`wght` 100..900, `opsz` 14..32) so the 600 instance is the same glyphs as before, and weight can move.
- 160 x 48 px (over the 44 px touch target Balsamiq asks for), 2 px black rule, square corners, white fill.
- Colours: `#000` and `#fff` only. Greys occur only inside blurred shadows (press, lift with shadow, glow).
- Focus-visible: 2 px outline offset 4 px. `prefers-reduced-motion` zeroes every transition.
- Label is white with `mix-blend-mode: difference`, so it reads black on white and white on black at every frame of every fill or sweep. No mid-transition grey text.

## Rules applied (Balsamiq, button design best practices)

- Contrast between label and fill in every state, so the label inverts in lockstep with the fill.
- Consistent shape, size, type, capitalisation and padding across all specimens; the effect is the only variable.
- 44 px minimum target: 48 px tall.
- Hover state must settle: no infinite animation while the pointer rests.
- The button must not leave the pointer: no sideways nudges.

## Press states (117)

Every specimen whose mechanism runs from hover also has a press: pointer down, held, on the same mechanism. The press is never a second effect. It relates to its hover in one of four ways, and the table names which.

- **Continue**: the hover value goes further. Halo closes to a double rule; Crossed frames reach further out; Magnet lands under the pointer.
- **Complete**: the hover left something part done and the press finishes it. Border revolve grows the dash back into the rule; Fill to pointer runs on to the far edge; Dock narrows onto one letter.
- **Reverse part way**: the hover runs back, leaving a trace. Inset fill thins to an inner band; Ink bleed drains to a disc on its entry point; Dither lifts back to a half dither.
- **Flip**: the same axis, the other sign. Tilt bounce tilts the other way; Lift lands flat; Lean leans back; Swell shrinks.

Held while down, back to the hover on release, back to rest on leaving. Space and Enter press the same way: CSS presses are written as `:is(:active,.act)` with the whole pressed look in the rule, so a keyboard press with no hover still lands on it; JavaScript presses read `s.down || s.kdown`, and where the press needs a point they take the press point or, from the keyboard, the centre. Presses that are pure pointer displacement (Magnet, Label lag, Cast shadow) are a no-op from the keyboard by nature. The cursor specimens have nothing to press without a pointer over the stage.

One specimen has no press: Proximity wake (51). Its whole mechanism is rule thickness, and a stroke-width change during a transition is a gate.

Quadrant direction (120) needed one trick: while the fill covers the box the quadrants under it cannot be hovered, so the press turns the fill's `pointer-events` off and the quadrant under the pointer names the edge the fill leaves by. Browsers only recompute hover after a layout change, so the pressed fill also moves its bottom edge by one clipped pixel; without that the quadrant registers only once the pointer moves.

| # | Name | Press | Relation |
|---|---|---|---|
| 01 | Invert | Fill pulls in from the rule | reverse part way |
| 02 | Lines retract | Fill clears, sides stay | reverse part way |
| 03 | Halo | Halo closes to a double rule | continue |
| 04 | Border revolve | Dash grows back to full rule | complete |
| 05 | Dot to pill | Pill shrinks back to the dot | reverse part way |
| 06 | Curtain drop | Curtain lifts halfway | reverse part way |
| 07 | Scale | Shrinks below its rest size | flip |
| 08 | Tilt bounce | Tilts back the other way | flip |
| 09 | Lift | Lands back flat | flip |
| 10 | Crossed frames | Frames reach further out | continue |
| 11 | Dash sweep | Halves rejoin into the rule | complete |
| 12 | Press in | Sinks deeper still | continue |
| 13 | Split sides | Bars push further out | continue |
| 14 | Sides close | Sides part around the label | reverse part way |
| 15 | Lift with shadow | Lands on its own shadow | flip |
| 16 | Inset fill | Fill thins to an inner band | reverse part way |
| 17 | Hard shadow | Button jumps onto its slab | complete |
| 18 | Split swipe | Halves pull back to quarters | reverse part way |
| 19 | Corner blob | Blob retreats to its corner | reverse part way |
| 20 | Border draw | Rule undraws itself | reverse part way |
| 21 | Flip | Flips on round to the front | continue |
| 22 | Liquid fill | Level drops to halfway | reverse part way |
| 23 | Gooey | Blobs pull back into the box | reverse part way |
| 24 | Fill sideways | Fill narrows to a centre bar | reverse part way |
| 25 | Fill vertical | Fill narrows to a mid band | reverse part way |
| 26 | Diagonal sweep | Narrows to a diagonal band | reverse part way |
| 27 | Skew wipe | Pulls back to a slanted half | reverse part way |
| 28 | Frame out | Frame closes back on the box | reverse part way |
| 29 | Radius morph | Rounds two opposite corners | flip |
| 30 | Glow | Glow flares wider | continue |
| 31 | Label slide | Slides back the other way | flip |
| 32 | Wipe | Fill rebounds to halfway | reverse part way |
| 33 | Perspective tilt | Tilts further back | continue |
| 34 | Corner marks | Marks tighten on the corners | continue |
| 35 | Tracking | Letters close up tight | flip |
| 36 | Stepped fill | Fill steps back to a half | reverse part way |
| 37 | Magnet | Snaps the rest of the way | continue |
| 38 | Label magnet | Carries past the pointer | continue |
| 39 | Ink bleed | Drains back to the entry | reverse part way |
| 40 | Follow disc | Pins where you pressed | reverse part way |
| 41 | Direction fill | Backs out the way it came | reverse part way |
| 42 | Direction out | Starts leaving early | complete |
| 43 | Pointer tilt | Leans near twice as far | continue |
| 44 | Wobble tilt | Rocking is caught level | reverse part way |
| 45 | Squash | Squashes the other way | flip |
| 46 | Label lag | Catches up all the way | complete |
| 47 | Edge bulge | Bows deeper and wider | continue |
| 48 | Elastic frame | Every edge gathers in | continue |
| 49 | Speed tracking | Packs the letters tight | flip |
| 52 | Cast shadow | Shadow swings to your side | flip |
| 53 | Label repel | Shies to the far edge | continue |
| 54 | Lean | Leans back the other way | flip |
| 55 | Sway | Holds the lean at full | complete |
| 56 | Slinky | Holds the stretch open | complete |
| 57 | Dimple | Collapses onto the press | continue |
| 58 | Fill to pointer | Fill runs on to the end | complete |
| 59 | Angle wipe | Wipes on out the far side | continue |
| 60 | Momentum | Leaves as fast as it came | flip |
| 61 | Pinhole | Hole shuts to a pinprick | reverse part way |
| 62 | Reticle | Ring fills in solid | complete |
| 63 | Crosshair | Arms run back to a tick | reverse part way |
| 64 | Scanner bar | Bar covers what it scanned | complete |
| 65 | Comet | Tail laid out and held | complete |
| 66 | Dwell bloom | Bloom collapses to a disc | reverse part way |
| 67 | Corner pull | All four corners reach it | continue |
| 68 | Push in | Dent returns, deeper | continue |
| 69 | Gap follows | Gap opens to two arcs | continue |
| 70 | Bead | Bead swells to a stud | continue |
| 71 | Swell | Swell runs the other way | flip |
| 72 | Rise to meet | Sinks below the plane | flip |
| 73 | Bolden | Runs on to the thin end | flip |
| 74 | Tracking by x | Tracks wider than the edge | continue |
| 75 | Weight by x | Commits to the nearer end | complete |
| 76 | Weight keys | Key under it goes thin | reverse part way |
| 77 | Dock | Narrows onto one letter | complete |
| 78 | Keys press | The key bottoms out | continue |
| 79 | Weight ripple | A thin wave runs back | reverse part way |
| 80 | Optical size | Optical size falls back | reverse part way |
| 81 | Face the pointer | Letters turn away from it | flip |
| 82 | Part | Opens into two blocks | complete |
| 83 | Weight by speed | Goes bold with no motion | complete |
| 84 | Weight by dwell | Weight flips about base | flip |
| 85 | Grass | The whole word goes over | continue |
| 86 | Weight holds width | Lets the bold word widen | reverse part way |
| 87 | Hatch fill | Breaks back into open lines | reverse part way |
| 88 | Halftone bloom | Tightens on the press point | continue |
| 89 | Stipple bleed | Soak runs back to the press | reverse part way |
| 90 | Dither wipe | Lifts back to half dither | reverse part way |
| 91 | Anticipation | Shrinks onto the guess | reverse part way |
| 92 | Hover intent | Retracts to the gate frame | reverse part way |
| 93 | Exit grace | Fill parts around the label | flip |
| 94 | Approach angle | Backs off to show the angle | reverse part way |
| 103 | Speech tail | Reaches out to a spike | continue |
| 104 | Notch | Bite turns out to a bulge | flip |
| 105 | Chamfer | All four corners cut | continue |
| 106 | Nearest corner rounds | Rounds the whole corner off | complete |
| 107 | Parallelogram | Shears back the other way | flip |
| 108 | Jelly | Pulls in instead of out | flip |
| 109 | Pendulum | Caught and held over | complete |
| 110 | Rubber band | Recoils past rest | flip |
| 111 | Weight drop | Drops the same fall again | continue |
| 112 | Cursor becomes button | Plate falls back to the dot | reverse part way |
| 113 | Sticky cursor | Lets go onto the press point | continue |
| 114 | Inverting cursor | Disc empties to a ring | reverse part way |
| 115 | Spring easing | Springs down below rest | flip |
| 116 | Conic sweep | Sweeps back to six o'clock | reverse part way |
| 117 | Sibling reacts | Plate spreads further behind | continue |
| 118 | Display transition | Plate grows out to the rule | continue |
| 119 | Anchored underline | Underline runs past the ends | continue |
| 120 | Quadrant direction | Leaves by the quadrant held | flip |
| 121 | Displacement by speed | Warp holds past top speed | continue |
| 122 | Dilate weight | Stems take the next step | continue |
| 123 | Threshold shadow | Cut drops, shadow surfaces | continue |
| 128 | Scramble settle | Scrambles again and holds | reverse part way |
| 129 | Typewriter reveal | Caret grows to a block | continue |
| 130 | Word swap by direction | Swaps to the other word | flip |
| 131 | Case morph | Caps return up to the press | reverse part way |

Verified with a press drive per specimen (hover, down 1.2s, up, leave, then focus and Space): rest identical before and after, press differs from hover, release returns to the hover value within spring rounding. Speed, dwell, heading and pendulum presses were driven with a moving pointer; label presses were read as text. Screenshots of every held press were read against the hover frame.

## Kept (36)

| # | Name | Source | Ref |
|---|---|---|---|
| 01 | Invert | 4c, 23 | ZEmvZxK, abQqxJW |
| 02 | Lines retract | 4a | ZEmvZxK |
| 03 | Halo | 2, 30a | ExOoMWV, KKrozLQ |
| 04 | Border revolve | 3 | gOQoyaZ |
| 05 | Dot to pill | 5 | GRwyaWo |
| 06 | Curtain drop | 7, 23 | WNYdqOY, abQqxJW |
| 07 | Scale | 11a | zYMRoQQ |
| 08 | Tilt bounce | 11b | zYMRoQQ |
| 09 | Lift | 11c | zYMRoQQ |
| 10 | Crossed frames | 12 | VwVQPWp |
| 11 | Dash sweep | 19 | eYQVQpx |
| 12 | Press in | 20 | ExOQOEj |
| 13 | Split sides | 21 | BaGYvyG |
| 14 | Sides close | 27a | poQLgBE |
| 15 | Lift with shadow | 27b | poQLgBE |
| 16 | Inset fill | 27c | poQLgBE |
| 17 | Hard shadow | 28 | zYMWqZj |
| 18 | Split swipe | 29 | VwVXaGZ |
| 19 | Corner blob | 30b | KKrozLQ |
| 20 | Border draw | 31 | jOQzrWx |
| 21 | Flip | 32 | eYQMzzx |
| 22 | Liquid fill | 33 | WNYzxZy |
| 23 | Gooey | 34 | GRwxqdM |
| 24 | Fill sideways | 35, 36a | LYXdZMb, XWyEKwb |
| 25 | Fill vertical | 36b | XWyEKwb |
| 26 | Diagonal sweep | 36c | XWyEKwb |
| 27 | Skew wipe | 36d | XWyEKwb |
| 28 | Frame out | 38a | VwVXKLM |
| 29 | Radius morph | 38c | VwVXKLM |
| 30 | Glow | 39, 27d | zYMWKqB, poQLgBE |
| 31 | Label slide | 40 | eYQMdrB |
| 32 | Wipe | menuhover 2 | Border Animation |
| 33 | Perspective tilt | menuhover 9 | Perspective Tilt |
| 34 | Corner marks | menuhover 14 | Electric Corners |
| 35 | Tracking | menuhover 15 | Magnetic Pull |
| 36 | Stepped fill | menuhover 18 | Retro Pixel Fill |

Rows 01 to 31 are TestMu article items; Ref is the CodePen id at `https://codepen.io/ocxigin/pen/<id>`. Rows 32 to 36 are positions on `https://menuhover.com/button-hover-styles/`; Ref is the name used there.

## Adaptations from the originals

- Anything visible at rest in the original (stacked shadow, backing slab, overhanging frames, the dot) is hidden at rest and appears on hover, so every specimen shares one rest state. Press down became press in; the slab became a hard shadow; the crossed frames extend instead of retract.
- Icon-driven effects lost their icons. Slide on (40) swaps the label for a copy of itself. Dot to pill (5) keeps the growing dot without the arrow.
- Multi-variant pens were split into one specimen per mechanism (4, 11, 27, 36, 38). Lifts that were bundled with a fill were separated so each specimen shows one thing.
- Gooey (34) also inverts the fill on hover so the blobs and the button read as one black shape under the filter. The filter is applied only during hover; corners soften by about one pixel at hover onset.

## Pointer-reactive (36)

| # | Name | Mechanism | Prior art |
|---|---|---|---|
| 37 | Magnet | Drifts toward the pointer, spring return | gsap |
| 38 | Label magnet | Frame fixed, label alone leans | gsap |
| 39 | Ink bleed | Fill grows as a disc from the entry point | gsap forum |
| 40 | Follow disc | A black disc tracks the pointer inside | new |
| 41 | Direction fill | Fill enters from the edge crossed | css-tricks |
| 42 | Direction out | And leaves by the edge exited | css-tricks |
| 43 | Pointer tilt | 3D tilt tracking pointer x and y | new |
| 44 | Wobble tilt | Same tracking, looser spring, overshoots | new |
| 45 | Squash | Stretches along travel, thins across it, by speed | new |
| 46 | Label lag | Label dragged behind on a short tether | new |
| 47 | Edge bulge | Nearest border edge bows away from the pointer | new |
| 48 | Elastic frame | All four edges lean toward it, by distance | new |
| 49 | Speed tracking | Letter-spacing opens with pointer speed | new |
| 50 | Press ripple | Ring expands from the press point, one pass | new |
| 51 | Proximity wake | Rule thickens before any hover, by distance | new |
| 52 | Cast shadow | Pointer is the light; hard shadow falls opposite | new |
| 53 | Label repel | Frame fixed, label shies away from the pointer | new |
| 54 | Lean | 2D skew toward the pointer, top edge leading | new |
| 55 | Sway | Rotates against the travel, rights itself at rest | new |
| 56 | Slinky | Each letter on a looser spring than the last | new |
| 57 | Dimple | Shrinks a little, pivoting on the pointer | new |
| 58 | Fill to pointer | Fill from the entry edge stops at the pointer | new |
| 59 | Angle wipe | Straight edge sweeps along the true entry angle | new |
| 60 | Momentum | Edge fill at the speed the pointer arrived | new |
| 61 | Pinhole | Goes black; a white hole rides under the pointer | new |
| 62 | Reticle | A hollow ring rides under the pointer | new |
| 63 | Crosshair | A rule through the pointer on each axis | new |
| 64 | Scanner bar | Full-height bar tracks the pointer sideways | new |
| 65 | Comet | Four discs on looser springs draw a tail | new |
| 66 | Dwell bloom | Disc grows while resting, shrinks while moving | new |
| 67 | Corner pull | Nearest corner reaches toward the pointer | new |
| 68 | Push in | Approaching edge dents inward, releases on entry | new |
| 69 | Gap follows | Border gap slides round to face the pointer | new |
| 70 | Bead | Bead on the border slides to the nearest point | new |
| 71 | Swell | Grows as the pointer approaches, by distance | new |
| 72 | Rise to meet | Lifts off a hard shadow on approach, lands on hover | new |

Prior art: magnet from the GSAP magnetic-button pens, direction-aware fill from the CSS-Tricks article and the GSAP forum thread on filling from the entered side. The rest have no source found and were built here. 53 to 72 were added on the second pass, 2026-09-10.

### How they work

One `pointermove` listener on `window` feeds every specimen; each reads its own rect and derives position, normalised position, velocity, proximity and the edge crossed. Every animated value runs through a damped spring integrated once per frame, so nothing snaps and everything settles. The frame loop runs only while something is moving and is torn down 1.8s after the last event, with a final frame that lands each spring exactly on its rest value. `prefers-reduced-motion` returns before any listener is attached, leaving the plain button.

Entry and exit edges are found by intersecting the last pointer segment with the box, not by nearest edge at the first inside sample: a fast diagonal approach otherwise reports the wrong side. The same crossing gives the exact entry point and angle for Ink bleed and Angle wipe. Effects with `reach` respond before hover, from a distance in pixels outside the box, with `near` falling linearly to zero at that distance.

### Rules held, same as the CSS set

- Rest state is identical to every other specimen; verified in the browser by driving each one and reading back its inline styles.
- Black and white only. The ripple is a ring, not a fade, because an opacity fade on black would introduce grey.
- Nothing animates while the pointer rests: speed-driven effects return to rest, position-driven ones hold a settled value.
- The magnet moves toward the pointer, never away, so the button cannot escape it.
- Proximity wake changes `border-width` on a border-box element, so nothing reflows.
- The label keeps `mix-blend-mode: difference` through every fill, disc and ripple.

## Variable font (14)

| # | Name | Mechanism |
|---|---|---|
| 73 | Bolden | Whole label 600 to 900 as the pointer approaches |
| 74 | Tracking by x | Letter-spacing .02em at the left edge to .30em at the right |
| 75 | Weight by x | 300 at the left edge to 900 at the right |
| 76 | Weight keys | Letter under the pointer goes 900, neighbours on a bell curve |
| 77 | Dock | Letter under the pointer scales to 1.6 from its baseline |
| 78 | Keys press | Letter under the pointer sinks 5px like a pressed key |
| 79 | Weight ripple | All letters head for 900 on staggered springs from the entry side |
| 80 | Optical size | `opsz` 14 to 32 by distance; tighter apertures, narrower word |
| 81 | Face the pointer | Each letter rotates toward the pointer, up to 24 degrees |
| 82 | Part | Letters within reach push apart to make room |
| 83 | Weight by speed | 600 to 900 with pointer speed, back to 600 at rest |
| 84 | Weight by dwell | 600 to 900 over about a second of resting |
| 85 | Grass | Letters skew away from the pointer, most where it is nearest |
| 86 | Weight holds width | 600 to 900 while letter-spacing gives back the width the glyphs take |

Per-letter specimens split the label into six `<i>` elements. Letter centres are measured on each entry, after fonts have loaded, so the bell curves sit on the real glyph positions. Weight is written as `font-weight` in whole units; optical size as `font-variation-settings: "opsz"`. Inter on Google Fonts has no `slnt` or `wdth` axis, so lean and part are transforms, not axes.

## Hatching and halftone (4)

| # | Name | Mechanism |
|---|---|---|
| 87 | Hatch fill | Parallel lines perpendicular to the pointer thicken from nothing at 140px to a solid fill under it |
| 88 | Halftone bloom | A 19 x 5 dot grid; each dot's radius follows a bell centred on the pointer, merging to solid under it |
| 89 | Stipple bleed | 260 seeded dots soak in from the entry point on a ragged front; 44px behind the front they have merged into solid ink |
| 90 | Dither wipe | Sixteen Bayer layers, one per threshold, each clipped a step behind the last, sweep in from the entry edge |

Darkness is line or dot density, so the palette stays two colours. Hatch is a `repeating-linear-gradient` with hard stops rewritten per frame; the other three are SVGs the size of the inner plate whose circles and rects are created once and resized per frame, never recoloured. Legibility over a mid-density texture was the risk. The difference-blend label preserves the glyph silhouette over any black-on-white texture, and that held in zoomed frames for hatch and halftone; the random stipple did not, at 58 percent coverage the label dissolved, so the stipple is now the fringe of a solid core. Dither passes mid-ramp because the ramp is transient (the spring crosses in about 250ms) and the resting state is solid.

## Intent and prediction (4)

| # | Name | Mechanism |
|---|---|---|
| 91 | Anticipation | Velocity extrapolated 150ms ahead; a disc blooms from the predicted landing point before arrival |
| 92 | Hover intent | Nothing until the pointer has been inside 80ms; then the fill grows from the centre |
| 93 | Exit grace | Fill holds 200ms after the pointer leaves, then retracts, so a brushed edge does not flicker |
| 94 | Approach angle | A straight edge sweeps along the pointer's heading over the last 300ms, not the crossing point |

The button responds to where the pointer is going. Anticipation reads velocity per frame from the unclamped position (the engine's `vx` is zero outside along the approach axis) and locks the disc centre where the pointer is predicted to land; a pass-by 30px above never fills; stopping short retracts within six frames. Hover intent is Invert with an 80ms gate: a 48ms pass-through leaves every inline style at rest. Exit grace read full at 100ms after leaving and retracting at 260ms; a leave-and-return inside 120ms never thinned. Approach angle keeps a 300ms history, reset on gaps, jumps and border crossings; a vertical approach 10px from a corner wipes top-down where Angle wipe would come from the left.

## Press, hold and release (5)

| # | Name | Mechanism |
|---|---|---|
| 95 | Hold to confirm | Fill tracks the hold, full at 600ms, holds black while down, retracts on release |
| 96 | Press depth by pressure | `PointerEvent.pressure` sets scale and inner shadow depth; a mouse reports .5, pens and force trackpads vary it |
| 97 | Drag-off cancel | Press fills from the bottom; release inside sinks it back; drag off while down and it drains through the exit edge |
| 98 | Release bounce | Compresses while held, more with time; on release overshoots by the hold, 1.03 for a tap to 1.11 after a second |
| 99 | Throw | Follows the pointer while down on a soft tether, carries on along the throw on release, overshoots and springs back |

Everything here runs from `pointerdown`: a hover writes nothing and the rest state is the plain button, so the baseline hover drive reports no held difference for depth, bounce and throw by design. Hold to confirm and Release bounce also run from Space or Enter through `kdown` and `held`. Throw captures the pointer on its own `pointerdown` listener so a drag past the box keeps the press. Drag-off reads the drain edge from `exit` on the frame after `cancel` and resets once drained, so re-entry never slides the plate diagonally. Verified by driving real down, move and up on every release path (inside, dragged off, tapped, keyboard, thrown from 220px out); each returned to the pristine rest. Nothing rejected.

## Keyboard and focus (3)

| # | Name | Mechanism |
|---|---|---|
| 100 | Direction-aware focus | Fill enters from the left on Tab, from the right on Shift-Tab, and leaves out the far side on blur |
| 101 | Key press | Space or Enter down sinks the button 3px under an inner shadow; release lets it up. A pointer press does the same |
| 102 | Focus dwell | Label weight rises 600 to 900 over about a second while keyboard focus rests, holds at 900, eases back on blur |

Nothing here responds to hover; the base focus ring stays and the effect sits inside it. The engine records Tab direction on the window keydown before focus moves, so the focus handler already knows which way the fill should come from. Direction-aware focus flips its side on blur, so a forward pass enters left and exits right as one continuous sweep. Mouse-click focus is ignored by matching `:focus-visible`, so a click never leaves a fill or a bold label behind when the pointer moves on. Verified with real Tab, Shift-Tab, Space and Enter in Playwright: frames held at the spring midpoint show the correct side each way, and every inline style returns to the base value after blur.

Dropped: keyboard equivalents for every pointer specimen; that is a per-row column in a degradations table, not a specimen.

## Shape morph (5)

| # | Name | Mechanism |
|---|---|---|
| 103 | Speech tail | A 12px point grows on the edge facing the pointer, from 100px out, slides round the perimeter to keep facing it, and its tip leans along the edge toward the pointer |
| 104 | Notch | A semicircular bite, up to 10px, opens in the border where the pointer is about to touch it from outside, slides along the edge with it, holds at the crossing point while inside, closes on leaving |
| 105 | Chamfer | The corner nearest the pointer is cut at 45 degrees, up to 16px along each edge, deeper the closer the pointer is to that corner, from outside or inside |
| 106 | Nearest corner rounds | The same corner gains radius instead of a cut, up to 22px, so one corner of the square button becomes a pill end |
| 107 | Parallelogram | The top edge shifts toward the pointer x and the bottom edge away, up to 12px each, so the outline shears while the label and the box under the pointer stay put |

The CSS border is transparent and the rule is an SVG path in the markup, redrawn per frame from the rest rectangle, so a `clip-path` never clips the stroke and the 2px rule follows the new outline. Joins are miter, not round, so the rest corners match the CSS border's square corners. With the rest rectangle in the markup, the border is present before the engine runs and under `prefers-reduced-motion`. Verified in Playwright: each specimen at rest is pixel-identical at 2x to a plain specimen in the same grid column, before hover, after hover and under reduced motion; the path returns to the exact rest string after settling; held states screenshotted from inside and outside; both code dialogs open cleanly.

## Physics beyond springs (4)

| # | Name | Mechanism |
|---|---|---|
| 108 | Jelly | Twelve masses on the border, tied to rest and to each other; the pointer pushes any within 36px from inside or out, and the ring rings out to the exact rectangle |
| 109 | Pendulum | Hangs from the middle of the top edge; pointer motion across it pushes the bob in the direction of travel, gravity swings it back, damped, up to 14 degrees |
| 110 | Rubber band | Label pinned at the end away from the pointer, the near end stretches toward it up to 1.42x and thins; on exit it snaps back on a stiffer spring with one overshoot |
| 111 | Weight drop | On entry the label falls 4px under gravity, bounces once about 1px, and lies still on the lower position; on exit it is lifted back on a near-critical spring |

Each specimen is a small body with mass rather than a value on a spring. Jelly keeps 24 extra springs in `s.x`, one per coordinate, with neighbour forces and the poke added to their velocities before `step`, so the engine's teardown snap lands it on rest for free; a `calm()` helper rounds every settled value to its target and the inline style is cleared, so rest is literally the pristine button. Pendulum reads pointer displacement per frame, not `s.vx`, so a resting pointer applies no force. Verified in Playwright with real pointer paths: trajectories recorded frame by frame, styles read 1.0s and 1.8s after the last event (rest at both, all four), first return to rest 214ms (Jelly), 131ms (Rubber band), 171ms (Weight drop) after the pointer left, and the pendulum still under a resting pointer after a swing.

Rejections: none.

## Cursor (3)

| # | Name | Mechanism |
|---|---|---|
| 112 | Cursor becomes button | An 8px dot rides under the pointer over the stage; cross into the button and it grows into a black plate that fills the box, leave and it shrinks back to a dot under the pointer. |
| 113 | Sticky cursor | The dot trails the pointer on a loose spring; inside the button it leaves the pointer and snaps to the centre, where it stays until the pointer leaves. |
| 114 | Inverting cursor | A white disc in difference blend reads black on the stage; the button goes black while the pointer is inside, so the disc flips to white the instant it crosses the rule, half and half while straddling it. |

CSS hides the system cursor over each card's stage and on the button; a `.cur` span inside the button is drawn in its place, so it may leave the box without clipping. Stage `pointerenter` shows it under the pointer in the same frame and `pointerleave` hides it at once, so no frame over the stage lacks a cursor; at rest the span has no inline style and is hidden by CSS. Reach is 260px so the engine keeps reading positions across the widest single-column stage. The inverting disc needs `isolation:auto` on its button so the blend reaches the page. Verified in Playwright at three pointer positions, on the rule, after leaving the stage, and under reduced motion.

## New CSS, no JavaScript (6)

| # | Name | Mechanism |
|---|---|---|
| 115 | Spring easing | The scale transition runs on a `linear()` curve sampled from a damped spring, so it overshoots three visible times before settling at 1.12. |
| 116 | Conic sweep | A registered `<angle>` custom property is the transitioned value; a conic-gradient stop reads it and the fill sweeps round from twelve o'clock. |
| 117 | Sibling reacts | A black plate sits before the button in the same grid cell, hidden under it; `:has()` lets the earlier sibling grow into an 8px surround on the later button's hover. |
| 118 | Display transition | The plate is `display:none` at rest; `transition-behavior: allow-discrete` keeps it in the tree while it shrinks out, and `@starting-style` gives the frame it grows in from. |
| 119 | Anchored underline | A sibling span with `position-anchor` and `anchor()` insets sits 6px under the button; the stage has no positioned wrapper, so only anchoring can find the box. |
| 120 | Quadrant direction | Four transparent triangles split the box; the hovered one names the keyframes the fill starts from, and the filled plate's own `:hover` then holds it. |

Each card leans on one feature the pure CSS section predates: `linear()` (Chrome 113, Safari 17.2, Firefox 112), `@property` (Chrome 85, Safari 16.4, Firefox 128), `:has()` (Chrome 105, Safari 15.4, Firefox 121), `@starting-style` with `transition-behavior` (Chrome 117, Safari 17.5, Firefox 129), anchor positioning (Chrome 125, Safari 26; Firefox pending). Where a feature is missing the card degrades to the plain button or to an instant end state: the anchor card is wrapped in `@supports`, an unregistered angle snaps, an unsupported `linear()` falls back to the base `ease`. Verified in Chromium 151: rest pixels identical to Invert for all six, held frame differs, rest returns after exit, Hover all and reduced motion (instant end states, no animation) checked.

Quadrant direction against the JS Direction fill (41): the triangles split a 160 by 48 box at its diagonals, so the left and right entries only exist within 24px of the centre line and a shallow entry near a corner reads as top or bottom, where the JS version uses the true entry edge. CSS has no memory, so the exit always leaves upward, where Direction out (42) leaves by the exit edge.

## SVG filters (3)

| # | Name | Mechanism |
|---|---|---|
| 121 | Displacement by speed | `feTurbulence` plus `feDisplacementMap` warp border and label together; `scale` follows pointer speed and is exactly zero at rest |
| 122 | Dilate weight | `feMorphology` dilates the label's stems sideways as the pointer nears, half a CSS pixel a side at most |
| 123 | Threshold shadow | A blurred, offset copy of the silhouette is cut to hard black by a discrete `feFuncA`; proximity lowers the cut and the shadow surfaces from under the right and bottom edges |

Each button carries its own `<filter>` in a zero-size SVG, referenced with `filter: url(#id)`; the primitive's attribute is written per frame and the `filter` property is cleared once the value settles to zero, so the resting render never passes through a filter and stays pixel-identical to the base. Displacement uses one octave of `fractalNoise` (turbulence streaked the rule into dots). Dilation against Bolden (73): the axis redraws the glyph, dilation keeps the outer contour and narrows the counters; browsers round the radius to whole device pixels, so it lands in one step, and x-only dilation reads as weight where isotropic dilation reads as a blur. The threshold shadow was pixel-sampled outside the box: only `#000` and `#fff` present.

Rejected: isotropic dilation at a full CSS pixel, the counters of B and O close.

## After the press (4)

| # | Name | Mechanism |
|---|---|---|
| 124 | Pending fill | A completed click starts a band that creeps left to right in uneven steps, is full at 1.6s, holds 0.3s, then clears out by the right edge |
| 125 | Success check | A 2px line slides out of the left border, crosses to the centre and bends into a check while the label leaves by the right edge; holds 1.2s, then slides back the way it came |
| 126 | Error settle | One sideways shake, three decaying cycles in half a second, then still; no fill, no colour |
| 127 | Undo countdown | The click commits and a 5px bar along the bottom edge drains from full width to nothing over 3s; a second click before it is gone cancels and resets |

States after a completed click, not hovers, hence their own section. Each starts in `up` or `keyup`, records its start time, and `frame` writes the elapsed state while extending `s.until`; when done it clears its inline styles and the loop tears down. Drag-off is a no-op; hover does nothing. The check is one path along the bottom and left rule, unseen, then across into the check; `stroke-dashoffset` slides a dash of the check's length into place. The pending clip overshoots the plate 2px; a clip edge on the plate edge antialiases grey. Verified in Playwright: styles at 0.3s, 1s, 2s and 4.5s after a click, the last equal to rest; hover, drag-off, keyboard and cancel read as rest.

## Label content (4)

| # | Name | Mechanism |
|---|---|---|
| 128 | Scramble settle | On entry every letter cycles through random capitals and settles on its own, left to right, in about 600ms; leaving restores the word at once |
| 129 | Typewriter reveal | The word is wiped and retyped from the side the pointer entered by, a letter every 85ms, a 2px caret on the letter about to appear |
| 130 | Word swap by direction | Enter from the left and it stays BUTTON; from the right it reads BOUTON, the two letters that differ swapping one by one from the entry side and back from the exit side |
| 131 | Case morph | Letters drop to their source case one by one, spreading out from the point of entry, and re-pack at natural spacing inside the fixed box; capitals return spreading from the exit |

The word changes, the box does not. Each letter is one of six inline-block cells fixed at its measured rest width once fonts load, glyphs centred, so a substitute glyph never moves the frame. Typewriter letters hide by transparent colour and the caret is an inset shadow, so no width is added. Case morph also measures lowercase advances and slides each glyph on a spring to its naturally set position, since narrow lowercase glyphs in capital cells read as loose tracking. Verified with Playwright from three sides: rest text B u t t o n, text-transform uppercase on every letter, label box 66.17px on every frame, inline styles at rest the six widths only, no console errors, code dialog renders.

Rejections: BOTON as the swapped word, five letters in a six-cell box leaves an empty cell.

## CSS or JavaScript

Every hover effect that depends only on the hover state, in or out, is pure CSS: fills, wipes, frames, shadows, transforms, SVG strokes, filters, stepped timing. JavaScript is needed only when the effect depends on where the pointer is or how it moves: a button that follows the cursor (magnetic), a spotlight or glow under the cursor, a fill that enters from the side the pointer came from, a tilt that tracks pointer position, a ripple from the click point, text scramble, canvas particles. MenuHover labels its Perspective Tilt and Magnetic Pull as cursor-following, but their CSS is a fixed tilt and a fixed scale; the following part does not exist there. Specimens 37 to 52 are that missing half, built out properly.

## Rejected from MenuHover, with reason

- 1 Gradient Fill: gradient-dependent; in black and white it is the wipe.
- 3 3D Push: hard bottom shadow at rest; hover-only version is Press in.
- 4 Neon Glow Pulse, 8 Glitch, 10 Ripple Wave, 12 Floating Dots, 13 Scroll Lines, 16 Holographic Shimmer, 17 Radar Scan: infinite animation while the pointer rests.
- 5 Text Reveal Slide: arrow icon; label slide covers the text motion.
- 6 Liquid Fill: bottom-up edge wipe; Curtain drop is the vertical edge wipe, Wipe the horizontal one. One entry per axis.
- 7 Particle Burst: one-shot particles with no settled state; the resting hover shows nothing.
- 11 Split Layer Slide: same frames as Sides close.
- 19 Blurred Shadow Grow: Lift with shadow plus a gradient ring.
- From 9 and 15 only the tilt and the letter-spacing were kept; the lifts, shadows and shimmer were duplicates or infinite.

## Rejected from the article, with reason

- 1 Spinner: infinite motion while hovering, label contrast drops.
- 4b Frames rotate: the rotated frames cut through the label at every angle.
- 6 Flip-up navbar, 13 Strikethrough: nav-link effects, and a line through a label reads as disabled.
- 8 Glow icon, 9 Hamburger, 15 Download, 16 and 17 icon transforms, 18 Social, 37 Font Awesome: icon-only or icon-dependent.
- 10 Animated gradient, 22 Flip gradient, 26 Gradient animated: gradient-dependent, becomes grey in black and white.
- 11d Nudge right: button moves out from under the pointer. 11e Opacity fade: black at 50 percent fails 7:1.
- 14 Bootstrap, 41 Price cards: a shade shift with no shade available.
- 24 Card icons, 25 Profile cards: not buttons.
- 38b Backplate: black plate behind a black button is invisible.

## Next categories

Twenty unexplored categories, in priority order: degradations column plus condition toggle, groups, scroll, timing grid, scale tests, sound, compositions, device, canvas.

## Next sources to mine

- Hover.css by Ian Lunn (`https://ianlunn.github.io/Hover/`, verified live 2026-09-10): about 26 2D, 18 background, 16 border and 7 shadow transitions. Licence is MIT for personal and open source use only since 2.2.0; a commercial licence is needed if this ships in a sold product. Reimplement, do not copy.
- menuhover.com: ingested 2026-09-10, 5 of 19 kept.
- uiverse.io buttons: returned 403 to a fetch on 2026-09-10; check in a browser.
- Pointer-reactive: codrops playground and the GSAP forum for velocity-driven and inertia effects; nothing was found for edge deformation or proximity, which is why 43 to 52 are new.

## Licence and attribution

MIT, see `LICENSE`. The code here is written from scratch on one shared base; where a mechanism came from somewhere else the Source and Ref columns above say where, and the Adaptations sections say what changed. Nothing is copied from those originals.
