#!/usr/bin/env python3
"""Generate buttons/index.html from the effect list. Run: python3 buttons/build.py"""
from pathlib import Path
import html

HERE = Path(__file__).parent
ARTICLE = "https://www.testmuai.com/blog/best-css-button-hover-effects/"
MENUHOVER = "https://menuhover.com/button-hover-styles/"
PEN = "https://codepen.io/ocxigin/pen/"

def A(*refs):
    """TestMu article items, each (item, codepen id)."""
    return ("article", [(ref, PEN + pen) for ref, pen in refs])

def M(*refs):
    """menuhover.com items by position on the page."""
    return ("menuhover", [(ref, MENUHOVER) for ref in refs])

# id, name, one-line mechanism (28 chars max, one line), source, kind
EFFECTS = [
    ("invert",   "Invert",           "Fill snaps to black",          A(("4c","ZEmvZxK"),("23","abQqxJW")), ""),
    ("lines",    "Lines retract",    "Lines retract, then fill",     A(("4a","ZEmvZxK")), ""),
    ("halo",     "Halo",             "Outer frame closes in",        A(("2","ExOoMWV"),("30a","KKrozLQ")), ""),
    ("revolve",  "Border revolve",   "Border orbits as a dash",      A(("3","gOQoyaZ")), "svg"),
    ("dot",      "Dot to pill",      "A dot grows into a pill fill", A(("5","GRwyaWo")), ""),
    ("curtain",  "Curtain drop",     "Fill drops in from the top",   A(("7","WNYdqOY"),("23","abQqxJW")), "clip"),
    ("scale",    "Scale",            "Grows ten percent in place",   A(("11a","zYMRoQQ")), ""),
    ("tilt",     "Tilt bounce",      "Bounces into a slight tilt",   A(("11b","zYMRoQQ")), ""),
    ("lift",     "Lift",             "Rises eight pixels",           A(("11c","zYMRoQQ")), ""),
    ("cross",    "Crossed frames",   "Frames extend past the edges", A(("12","VwVQPWp")), ""),
    ("dash",     "Dash sweep",       "Border splits, halves sweep",  A(("19","eYQVQpx")), "svg"),
    ("press",    "Press in",         "Sinks with an inner shadow",   A(("20","ExOQOEj")), ""),
    ("split",    "Split sides",      "Sides shrink, ends widen",     A(("21","BaGYvyG")), ""),
    ("sides",    "Sides close",      "Sides slide in to the middle", A(("27a","poQLgBE")), ""),
    ("liftsh",   "Lift with shadow", "Rises over a soft shadow",     A(("27b","poQLgBE")), ""),
    ("inset",    "Inset fill",       "All edges close in to fill",   A(("27c","poQLgBE")), ""),
    ("slab",     "Hard shadow",      "A solid slab appears behind",  A(("28","zYMWqZj")), ""),
    ("swipe",    "Split swipe",      "Two half bars cross to fill",  A(("29","VwVXaGZ")), "clip"),
    ("blob",     "Corner blob",      "A disc grows from the corner", A(("30b","KKrozLQ")), "clip"),
    ("draw",     "Border draw",      "Border redraws clockwise",     A(("31","jOQzrWx")), ""),
    ("flip",     "Flip",             "Flips to an inverted back",    A(("32","eYQMzzx")), "flip"),
    ("liquid",   "Liquid fill",      "Three waves rise and fill",    A(("33","WNYzxZy")), "clip liquid"),
    ("goo",      "Gooey",            "Gooey blobs bulge outward",    A(("34","GRwxqdM")), "goo"),
    ("fillx",    "Fill sideways",    "Fill spreads out sideways",    A(("35","LYXdZMb"),("36a","XWyEKwb")), "clip"),
    ("filly",    "Fill vertical",    "Fill spreads up and down",     A(("36b","XWyEKwb")), "clip"),
    ("diag",     "Diagonal sweep",   "Diagonal bar widens to fill",  A(("36c","XWyEKwb")), "clip"),
    ("skew",     "Skew wipe",        "A skewed bar wipes in",        A(("36d","XWyEKwb")), "clip"),
    ("frameout", "Frame out",        "Fills, frame expands outward", A(("38a","VwVXKLM")), ""),
    ("radius",   "Radius morph",     "Corners round into a pill",    A(("38c","VwVXKLM")), ""),
    ("glow",     "Glow",             "A soft glow spreads around",   A(("39","zYMWKqB"),("27d","poQLgBE")), ""),
    ("slide",    "Label slide",      "Label slides out and back in", A(("40","eYQMdrB")), "clip slide"),
    ("wipe",     "Wipe",             "Fill wipes left to right",     M("2"), "clip"),
    ("persp",    "Perspective tilt", "Tilts back in perspective",    M("9"), ""),
    ("corners",  "Corner marks",     "Marks appear at the corners",  M("14"), "corners"),
    ("track",    "Tracking",         "Letters space out",            M("15"), ""),
    ("steps",    "Stepped fill",     "Fill grows in eight steps",    M("18"), "clip"),
]

GSAP = "https://codepen.io/supah/pen/LYWKzEG"
CSSTRICKS = "https://css-tricks.com/direction-aware-hover-effects/"
GSAPF = "https://gsap.com/community/forums/topic/34990-filling-the-button-on-hover-from-the-side-of-the-entered-cursor-position/"

def P(*refs):
    """Prior art for a pointer-reactive effect, each (label, url)."""
    return ("prior art", list(refs))

NEW = ("new", [])

# id, name, one-line mechanism (28 chars max), source, parts needed
POINTER = [
    ("magnet",   "Magnet",           "Drifts toward the pointer",    P(("gsap", GSAP)), ""),
    ("maglabel", "Label magnet",     "Label drifts, frame stays",    P(("gsap", GSAP)), ""),
    ("bleed",    "Ink bleed",        "Fill grows from entry point",  P(("gsap", GSAPF)), "ink"),
    ("disc",     "Follow disc",      "A disc follows the pointer",   NEW, "ink clip"),
    ("dirfill",  "Direction fill",   "Fill enters from that edge",   P(("css-tricks", CSSTRICKS)), "ink clip"),
    ("dirout",   "Direction out",    "Fill leaves by the exit edge", P(("css-tricks", CSSTRICKS)), "ink clip"),
    ("ptilt",    "Pointer tilt",     "Tilts to track the pointer",   NEW, ""),
    ("wobble",   "Wobble tilt",      "Tilt overshoots and settles",  NEW, ""),
    ("squash",   "Squash",           "Stretches along the travel",   NEW, ""),
    ("lag",      "Label lag",        "Label trails the pointer",     NEW, ""),
    ("bulge",    "Edge bulge",       "Nearest edge bows outward",    NEW, "path"),
    ("cloth",    "Elastic frame",    "All four edges lean to it",    NEW, "path"),
    ("speed",    "Speed tracking",   "Tracking opens with speed",    NEW, ""),
    ("ripple",   "Press ripple",     "Ring from the press point",    NEW, "ink clip"),
    ("awake",    "Proximity wake",   "Rule thickens as you near",    NEW, ""),
    ("cast",     "Cast shadow",      "Shadow falls away from it",    NEW, ""),
    ("repel",    "Label repel",      "Label shies away from it",     NEW, ""),
    ("lean",     "Lean",             "Skews toward the pointer",     NEW, ""),
    ("sway",     "Sway",             "Leans against the travel",     NEW, ""),
    ("slinky",   "Slinky",           "Letters trail one by one",     NEW, "letters"),
    ("dimple",   "Dimple",           "Shrinks toward the pointer",   NEW, ""),
    ("reach",    "Fill to pointer",  "Fill reaches the pointer",     NEW, "ink"),
    ("angle",    "Angle wipe",       "Wipes along the entry angle",  NEW, "ink clip"),
    ("momentum", "Momentum",         "Fills as fast as you enter",   NEW, "ink clip"),
    ("pinhole",  "Pinhole",          "Black, with a hole at it",     NEW, "ink hole clip"),
    ("reticle",  "Reticle",          "A ring circles the pointer",   NEW, "ink clip"),
    ("xhair",    "Crosshair",        "Lines cross at the pointer",   NEW, "cross clip"),
    ("scan",     "Scanner bar",      "A bar tracks the pointer x",   NEW, "ink clip"),
    ("comet",    "Comet",            "Disc trails a tail behind",    NEW, "dots clip"),
    ("dwell",    "Dwell bloom",      "Grows the longer you rest",    NEW, "ink"),
    ("cpull",    "Corner pull",      "Nearest corner reaches it",    NEW, "path"),
    ("push",     "Push in",          "Edge dents as you approach",   NEW, "path"),
    ("gap",      "Gap follows",      "Border gap faces the pointer", NEW, "rect"),
    ("bead",     "Bead",             "Bead slides toward it",        NEW, "bead"),
    ("swell",    "Swell",            "Grows as you approach",        NEW, ""),
    ("rise",     "Rise to meet",     "Lifts to meet you, lands",     NEW, ""),
]

VARFONT = [
    ("bolden",   "Bolden",           "Weight rises as you near",     NEW, ""),
    ("xtrack",   "Tracking by x",    "Spacing opens left to right",  NEW, ""),
    ("weightx",  "Weight by x",      "Thin at left, bold at right",  NEW, ""),
    ("wkeys",    "Weight keys",      "Letter under it goes bold",    NEW, "letters"),
    ("dock",     "Dock",             "Letter under it grows",        NEW, "letters"),
    ("keys",     "Keys press",       "Letter under it sinks",        NEW, "letters"),
    ("wripple",  "Weight ripple",    "Bold travels through word",    NEW, "letters"),
    ("opsz",     "Optical size",     "Optical size by distance",     NEW, ""),
    ("face",     "Face the pointer", "Letters turn to face it",      NEW, "letters"),
    ("part",     "Part",             "Letters part around it",       NEW, "letters"),
    ("wspeed",   "Weight by speed",  "Bolder the faster you move",   NEW, ""),
    ("wdwell",   "Weight by dwell",  "Bolder the longer you rest",   NEW, ""),
    ("grass",    "Grass",            "Letters lean away from it",    NEW, "letters"),
    ("holdw",    "Weight holds width","Bolder, width held fixed",    NEW, ""),
]

HATCH = [
    ("hatch",    "Hatch fill",       "Lines close up as you near",   NEW, "ink"),
    ("halftone", "Halftone bloom",   "Dots swell under the pointer", NEW, "fill"),
    ("stipple",  "Stipple bleed",    "Dots soak in from the entry",  NEW, "ink fill"),
    ("dither",   "Dither wipe",      "Ordered dither from the edge", NEW, "fill"),
]

# ---- 02-intent ----
L_02_INTENT = [('predict', 'Anticipation', 'Fill starts before arrival', ('new', []), 'ink'), ('intent', 'Hover intent', 'Fills only after 80ms inside', ('new', []), 'ink'), ('linger', 'Exit grace', 'Fill holds 200ms after exit', ('new', []), 'ink'), ('heading', 'Approach angle', 'Fill sweeps along heading', ('new', []), 'ink clip')]

# ---- 03-press ----
L_03_PRESS = [('confirm', 'Hold to confirm', 'Fill grows while you hold', ('new', []), 'ink clip'), ('depth', 'Press depth by pressure', 'Sinks deeper with pressure', ('new', []), ''), ('dragoff', 'Drag-off cancel', 'Fill drains by the exit edge', ('new', []), 'ink clip'), ('rebound', 'Release bounce', 'Bounces more the longer held', ('new', []), ''), ('throw', 'Throw', 'Drag, release, springs back', ('new', []), '')]

# ---- 04-keyboard ----
L_04_KEYBOARD = [('tabfill', 'Direction-aware focus', 'Fill follows Tab direction', ('new', []), 'ink clip'), ('spacebar', 'Key press', 'Space or Enter presses it in', ('new', []), ''), ('fdwell', 'Focus dwell', 'Bolder while focus rests', ('new', []), '')]

# ---- 05-shape ----
L_05_SHAPE = [('tail', 'Speech tail', 'A point grows to face you', ('new', []), 'outline'), ('notch', 'Notch', 'A bite opens where you touch', ('new', []), 'outline'), ('chamfer', 'Chamfer', 'Nearest corner cuts at 45', ('new', []), 'outline'), ('rounds', 'Nearest corner rounds', 'Only the near corner rounds', ('new', []), 'outline'), ('shear', 'Parallelogram', 'Sides shear by pointer x', ('new', []), 'outline')]

# ---- 06-physics ----
L_06_PHYSICS = [('jelly', 'Jelly', 'Outline dents where you poke', ('new', []), 'path'), ('pendulum', 'Pendulum', 'Hangs, swings when pushed', ('new', []), ''), ('rubber', 'Rubber band', 'Label stretches, snaps back', ('new', []), ''), ('thud', 'Weight drop', 'Label lands, bounces once', ('new', []), '')]

# ---- 08-cursor ----
L_08_CURSOR = [('become', 'Cursor becomes button', 'Dot grows to fill the button', ('prior art', [('codrops', 'https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/')]), 'cur'), ('sticky', 'Sticky cursor', 'Dot lags, snaps to centre', ('prior art', [('codrops', 'https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/')]), 'cur'), ('lens', 'Inverting cursor', 'Disc flips at the border', ('prior art', [('codrops', 'https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/')]), 'cur ink')]

# ---- 10-newcss ----
L_10_NEWCSS = [('curve', 'Spring easing', 'Scale springs, three bounces', ('new', []), ''), ('conic', 'Conic sweep', 'Typed angle sweeps the fill', ('new', []), ''), ('peer', 'Sibling reacts', 'Prior sibling grows behind', ('new', []), ''), ('emerge', 'Display transition', 'Appears out of display:none', ('new', []), ''), ('anchor', 'Anchored underline', 'Sibling anchored to the box', ('new', []), ''), ('quad', 'Quadrant direction', 'Fill enters from that edge', ('new', []), '')]

# ---- 11-filters ----
L_11_FILTERS = [('displace', 'Displacement by speed', 'Warps the faster you move', ('new', []), 'fdisplace'), ('dilate', 'Dilate weight', 'Strokes dilate as you near', ('new', []), 'fdilate'), ('thresh', 'Threshold shadow', 'Blurred shadow snapped hard', ('new', []), 'fthresh')]

# ---- 13-after ----
L_13_AFTER = [('pending', 'Pending fill', 'Fill creeps to full, clears', ('new', []), 'ink'), ('check', 'Success check', 'Check draws from the border', ('new', []), 'path clip'), ('shake', 'Error settle', 'One shake, then still', ('new', []), ''), ('undo', 'Undo countdown', 'Bar drains, click to cancel', ('new', []), 'ink')]

# ---- 20-label ----
L_20_LABEL = [('scramble', 'Scramble settle', 'Letters cycle then settle', ('new', []), 'letters'), ('type', 'Typewriter reveal', 'Retypes from the entry side', ('new', []), 'letters'), ('swap', 'Word swap by direction', 'BOUTON from the right half', ('new', []), 'letters'), ('case', 'Case morph', 'Lowercase spreads from it', ('new', []), 'letters')]

# @@LISTS@@ (new category lists are spliced in above this line)

# ---- press states. One caption per specimen that has one (28 chars max). The
# press is the specimen's own hover taken further, completed, reversed part way
# or flipped; CSS in hover.css as :is(:active,.act), JS inside the PFX entry. ----
PRESS = {
    "invert":   "Fill pulls in from the rule",
    "lines":    "Fill clears, sides stay",
    "halo":     "Halo closes to a double rule",
    "revolve":  "Dash grows back to full rule",
    "dot":      "Pill shrinks back to the dot",
    "curtain":  "Curtain lifts halfway",
    "scale":    "Shrinks below its rest size",
    "tilt":     "Tilts back the other way",
    "lift":     "Lands back flat",
    "cross":    "Frames reach further out",
    "dash":     "Halves rejoin into the rule",
    "press":    "Sinks deeper still",
    "split":    "Bars push further out",
    "sides":    "Sides part around the label",
    "liftsh":   "Lands on its own shadow",
    "inset":    "Fill thins to an inner band",
    "slab":     "Button jumps onto its slab",
    "swipe":    "Halves pull back to quarters",
    "blob":     "Blob retreats to its corner",
    "draw":     "Rule undraws itself",
    "flip":     "Flips on round to the front",
    "liquid":   "Level drops to halfway",
    "goo":      "Blobs pull back into the box",
    "fillx":    "Fill narrows to a centre bar",
    "filly":    "Fill narrows to a mid band",
    "diag":     "Narrows to a diagonal band",
    "skew":     "Pulls back to a slanted half",
    "frameout": "Frame closes back on the box",
    "radius":   "Rounds two opposite corners",
    "glow":     "Glow flares wider",
    "slide":    "Slides back the other way",
    "wipe":     "Fill rebounds to halfway",
    "persp":    "Tilts further back",
    "corners":  "Marks tighten on the corners",
    "track":    "Letters close up tight",
    "steps":    "Fill steps back to a half",
    "curve":    "Springs down below rest",
    "conic":    "Sweeps back to six o'clock",
    "peer":     "Plate spreads further behind",
    "emerge":   "Plate grows out to the rule",
    "anchor":   "Underline runs past the ends",
    "quad":     "Leaves by the quadrant held",
    "magnet": "Snaps the rest of the way",
    "maglabel": "Carries past the pointer",
    "bleed": "Drains back to the entry",
    "disc": "Pins where you pressed",
    "dirfill": "Backs out the way it came",
    "dirout": "Starts leaving early",
    "ptilt": "Leans near twice as far",
    "wobble": "Rocking is caught level",
    "squash": "Squashes the other way",
    "lag": "Catches up all the way",
    "bulge": "Bows deeper and wider",
    "cloth": "Every edge gathers in",
    "speed": "Packs the letters tight",
    "cast": "Shadow swings to your side",
    "repel": "Shies to the far edge",
    "lean": "Leans back the other way",
    "sway": "Holds the lean at full",
    "slinky": "Holds the stretch open",
    "dimple": "Collapses onto the press",
    "reach": "Fill runs on to the end",
    "angle": "Wipes on out the far side",
    "momentum": "Leaves as fast as it came",
    "pinhole": "Hole shuts to a pinprick",
    "reticle": "Ring fills in solid",
    "xhair": "Arms run back to a tick",
    "scan": "Bar covers what it scanned",
    "comet": "Tail laid out and held",
    "dwell": "Bloom collapses to a disc",
    "cpull": "All four corners reach it",
    "push": "Dent returns, deeper",
    "gap": "Gap opens to two arcs",
    "bead": "Bead swells to a stud",
    "swell": "Swell runs the other way",
    "rise": "Sinks below the plane",
    "bolden": "Runs on to the thin end",
    "xtrack": "Tracks wider than the edge",
    "weightx": "Commits to the nearer end",
    "wkeys": "Key under it goes thin",
    "dock": "Narrows onto one letter",
    "keys": "The key bottoms out",
    "wripple": "A thin wave runs back",
    "opsz": "Optical size falls back",
    "face": "Letters turn away from it",
    "part": "Opens into two blocks",
    "wspeed": "Goes bold with no motion",
    "wdwell": "Weight flips about base",
    "grass": "The whole word goes over",
    "holdw": "Lets the bold word widen",
    "hatch": "Breaks back into open lines",
    "halftone": "Tightens on the press point",
    "stipple": "Soak runs back to the press",
    "dither": "Lifts back to half dither",
    "predict": "Shrinks onto the guess",
    "intent": "Retracts to the gate frame",
    "linger": "Fill parts around the label",
    "heading": "Backs off to show the angle",
    "displace": "Warp holds past top speed",
    "dilate": "Stems take the next step",
    "thresh": "Cut drops, shadow surfaces",
    "tail": "Reaches out to a spike",
    "notch": "Bite turns out to a bulge",
    "chamfer": "All four corners cut",
    "rounds": "Rounds the whole corner off",
    "shear": "Shears back the other way",
    "jelly": "Pulls in instead of out",
    "pendulum": "Caught and held over",
    "rubber": "Recoils past rest",
    "thud": "Drops the same fall again",
    "become": "Plate falls back to the dot",
    "sticky": "Lets go onto the press point",
    "lens": "Disc empties to a ring",
    "scramble": "Scrambles again and holds",
    "type": "Caret grows to a block",
    "swap": "Swaps to the other word",
    "case": "Caps return up to the press",
    # @@PRESS@@ (JS press captions are spliced in above this line)
}

# what the description line describes: hover unless the specimen runs from something else
TAGS = {"ripple": "press", "confirm": "press", "depth": "press", "dragoff": "press", "rebound": "press", "throw": "press",
        "tabfill": "focus", "spacebar": "key", "fdwell": "focus",
        "pending": "click", "check": "click", "shake": "click", "undo": "click"}

def rows(fid, desc):
    """the description row, tagged, plus the press row when the specimen has one"""
    out = f'<div class="row"><span class="desc">{html.escape(desc)}</span><span class="tag">{TAGS.get(fid, "hover")}</span></div>'
    if fid in PRESS:
        assert len(PRESS[fid]) <= 28, (fid, len(PRESS[fid]))
        out += f'\n    <div class="row"><span class="desc">{html.escape(PRESS[fid])}</span><span class="tag">press</span></div>'
    return out

# title, blurb, list, kind ("css" cards have one CSS button; "js" cards have CSS and JS)
SECTIONS = [
    ("Pure CSS", "The response is the same wherever the pointer enters or how fast it moves.", EFFECTS, "css"),
    ("Pointer-reactive", "The response depends on pointer position, speed or entry edge, so it needs JavaScript. Hover all does not apply.", POINTER, "js"),
    ("Variable font", "Inter loaded as a variable font: weight 100 to 900 and optical size 14 to 32 are written per frame, some per letter, all pointer-driven.", VARFONT, "js"),
    ("Hatching and halftone", "Darkness as line or dot density, so the fill is still only black on white. The pointer sets density, angle and origin.", HATCH, "js"),
    ('Intent and prediction', 'The button responds to where the pointer is going, not where it is: velocity, dwell and heading decide the fill.', L_02_INTENT, 'js'),
    ('Press, hold and release', 'The response runs from pointerdown: how long it was held, how hard, where it let go. Hover alone shows nothing.', L_03_PRESS, 'js'),
    ('Keyboard and focus', 'Nothing happens on hover. Tab direction, Space or Enter, and how long focus rests drive the value. Tab into a card to see it.', L_04_KEYBOARD, 'js'),
    ('Shape morph', 'The outline itself changes shape. The rule is an SVG path redrawn per frame, so a tail, bite, cut or shear keeps its 2px stroke.', L_05_SHAPE, 'js'),
    ('Physics beyond springs', 'Bodies with mass: a soft outline, a hanging plate, an elastic label, a dropped weight. Each settles under a second.', L_06_PHYSICS, 'js'),
    ('Cursor', 'The pointer itself is the effect. The system cursor is hidden over the stage and a drawn cursor, a child of the button, replaces it.', L_08_CURSOR, 'js'),
    ('New CSS, no JavaScript', 'Features the pure CSS section predates: linear() springs, @property, :has(), @starting-style, anchor positioning, quadrant hit areas.', L_10_NEWCSS, 'css'),
    ('SVG filters', 'Filter primitives defined inline in the button and written per frame; the filter is removed at rest so the rest render is untouched.', L_11_FILTERS, 'js'),
    ('After the press', 'States that begin on a completed click, not on hover: each runs by itself and is back at rest within four seconds.', L_13_AFTER, 'js'),
    ('Label content', 'The word changes, not the box: letters scramble and settle, retype from the entry side, swap language by direction, or change case.', L_20_LABEL, 'js'),
    # @@SECTIONS@@
]

SVG_RECT = '<svg viewBox="0 0 160 48" aria-hidden="true"><rect x="1" y="1" width="158" height="46"/></svg>'

def button(fid, kind):
    if fid in STAGE: return STAGE[fid]
    cls = f"fx fx-{fid}"
    if "clip" in kind: cls += " clip"
    if kind == "flip":
        inner = '<span class="flip"><span class="face front">Button</span><span class="face back">Button</span></span>'
        return f'<button type="button" class="{cls}">{inner}</button>'
    label = '<span class="label">Button</span>'
    if "slide" in kind:
        label = '<span class="label l1">Button</span><span class="label l2">Button</span>'
    extra = ""
    if kind == "svg": extra = SVG_RECT
    if "liquid" in kind: extra = '<span class="wave" aria-hidden="true"><i></i><i></i><i></i></span>'
    if kind == "corners": extra = '<span class="marks" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
    btn = f'<button type="button" class="{cls}">{label}{extra}</button>'
    if kind == "goo": btn = f'<span class="goo">{btn}</span>'
    return btn

def card(i, e):
    fid, name, desc, (site, refs), kind = e
    assert len(desc) <= 28, (fid, len(desc))
    links = ", ".join(f'<a href="{url}" target="_blank" rel="noopener">{html.escape(ref)}</a>' for ref, url in refs)
    return f'''<figure class="card" data-id="{fid}">
  <div class="stage">{button(fid, kind)}</div>
  <figcaption>
    <div class="row"><span class="num">{i:02d}</span><b class="name">{html.escape(name)}</b><span class="src">{site} {links}</span></div>
    {rows(fid, desc)}
    <div class="row codes"><button type="button" class="css-btn" data-kind="css" aria-label="Show CSS for {html.escape(name)}">CSS</button></div>
  </figcaption>
</figure>'''

SVG_PATH = '<svg viewBox="0 0 160 48" aria-hidden="true"><path d=""/></svg>'

SVG_BEAD = '<svg viewBox="0 0 160 48" aria-hidden="true"><rect x="1" y="1" width="158" height="46"/><circle cx="80" cy="1" r="0"/></svg>'
PARTS = {
    "ink":     '<span class="ink" aria-hidden="true"></span>',
    "hole":    '<span class="hole" aria-hidden="true"></span>',
    "cross":   '<span class="hx" aria-hidden="true"></span><span class="vy" aria-hidden="true"></span>',
    "dots":    ''.join(f'<span class="dot d{i}" aria-hidden="true"></span>' for i in (1, 2, 3, 4)),
    "path":    SVG_PATH,
    "rect":    SVG_RECT,
    "bead":    SVG_BEAD,
    "fill":    '<svg aria-hidden="true" data-gen="1"></svg>',
    'outline': '<svg viewBox="0 0 160 48" aria-hidden="true"><path d="M1 1 L159 1 L159 47 L1 47Z"/></svg>',
    'cur': '<span class="cur" aria-hidden="true"></span>',
    'fdisplace': '<svg class="fdef" aria-hidden="true"><filter id="f-displace" x="-25%" y="-60%" width="150%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.03" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>',
    'fdilate': '<svg class="fdef" aria-hidden="true"><filter id="f-dilate" x="-10%" y="-50%" width="120%" height="200%"><feMorphology operator="dilate" radius="0"/></filter></svg>',
    'fthresh': '<svg class="fdef" aria-hidden="true"><filter id="f-thresh" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur in="SourceAlpha" stdDeviation="9"/><feOffset dx="8" dy="8"/><feComponentTransfer result="cut"><feFuncA type="discrete" tableValues="0"/></feComponentTransfer><feMerge><feMergeNode in="cut"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>',
    # @@PARTS@@
}

STAGE = {
    'peer': '<span class="fx-peer-mark" aria-hidden="true"></span><button type="button" class="fx fx-peer"><span class="label">Button</span></button>',
    'anchor': '<button type="button" class="fx fx-anchor"><span class="label">Button</span></button><span class="fx-anchor-tip" aria-hidden="true"></span>',
    'quad': '<button type="button" class="fx fx-quad clip"><span class="label">Button</span><i class="q" aria-hidden="true"></i><i class="q" aria-hidden="true"></i><i class="q" aria-hidden="true"></i><i class="q" aria-hidden="true"></i><span class="qfill" aria-hidden="true"></span></button>',
}

def pbutton(fid, parts):
    if fid in STAGE: return STAGE[fid]
    toks = parts.split()
    cls = f"fx fx-{fid}"
    if "clip" in toks: cls += " clip"
    label = '<span class="label">Button</span>'
    if "letters" in toks:
        label = '<span class="label">' + ''.join(f'<i>{c}</i>' for c in "Button") + '</span>'
    extra = ''.join(PARTS[t] for t in toks if t in PARTS)
    return f'<button type="button" class="{cls}" data-p="{fid}">{label}{extra}</button>'

def pcard(i, e):
    fid, name, desc, (site, refs), parts = e
    assert len(desc) <= 28, (fid, len(desc))
    links = ", ".join(f'<a href="{url}" target="_blank" rel="noopener">{html.escape(ref)}</a>' for ref, url in refs)
    src = f"{site} {links}".strip()
    return f'''<figure class="card" data-id="{fid}" data-js="1">
  <div class="stage">{pbutton(fid, parts)}</div>
  <figcaption>
    <div class="row"><span class="num">{i:02d}</span><b class="name">{html.escape(name)}</b><span class="src">{src}</span></div>
    {rows(fid, desc)}
    <div class="row codes"><button type="button" class="css-btn" data-kind="css" aria-label="Show CSS for {html.escape(name)}">CSS</button><button type="button" class="css-btn" data-kind="js" aria-label="Show JavaScript for {html.escape(name)}">JS</button></div>
  </figcaption>
</figure>'''

def sections_html():
    out, num = [], 0
    for title, blurb, lst, kind in SECTIONS:
        fn = card if kind == "css" else pcard
        cards = "\n".join(fn(num + i + 1, e) for i, e in enumerate(lst))
        num += len(lst)
        out.append(f'''<section class="secbar">
  <h2>{html.escape(title)}</h2>
  <p>{len(lst)} effects. {blurb}</p>
</section>

<main class="grid">
{cards}
</main>
''')
    return "\n".join(out), num

SECTIONS_HTML, TOTAL = sections_html()
SPEC = ", ".join(f"{len(lst)} {title.lower() if kind == 'js' else title}" for title, blurb, lst, kind in SECTIONS)
n, pn, vn, hn = len(EFFECTS), len(POINTER), len(VARFONT), len(HATCH)

PAGE = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Button Hover Specimens</title>
<meta name="description" content="131 button hover mechanisms on one identical button. Pure CSS and pointer-reactive, each with its own markup and code to copy. No dependencies.">
<link rel="canonical" href="https://jsabutis.github.io/button-interaction-specs/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jsabutis.github.io/button-interaction-specs/">
<meta property="og:title" content="Button Hover Specimens">
<meta property="og:description" content="131 button hover mechanisms on one identical button. Pure CSS and pointer-reactive, each with its own markup and code to copy. No dependencies.">
<meta property="og:image" content="https://jsabutis.github.io/button-interaction-specs/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A grid of 36 identical buttons, each held in a different hover state, black on white.">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="hover.css">
<link rel="stylesheet" href="pointer.css">
<style>
:root{{--ink:#000;--paper:#fff;--mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--sans:Inter,"Helvetica Neue",Arial,sans-serif}}
*{{box-sizing:border-box}}
html{{color-scheme:light only}}
body{{margin:0;background:var(--paper);color:var(--ink);font:400 14px/1.5 var(--sans);-webkit-font-smoothing:antialiased}}
a{{color:inherit}}
header{{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px 32px;padding:28px 32px 20px;border-bottom:2px solid var(--ink)}}
header h1{{margin:0;font:600 22px/1.2 var(--sans);letter-spacing:-.01em}}
header .spec{{font:400 12px/1.5 var(--mono);letter-spacing:.01em;white-space:nowrap}}
header .controls{{margin-left:auto;display:flex;gap:24px;align-items:center;font:500 12px/1 var(--mono);text-transform:uppercase;letter-spacing:.08em}}
.switch{{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none}}
.switch input{{appearance:none;width:36px;height:20px;margin:0;border:2px solid var(--ink);background:var(--paper);position:relative;cursor:pointer;transition:background-color .2s}}
.switch input::after{{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;background:var(--ink);transition:transform .2s,background-color .2s}}
.switch input:checked{{background:var(--ink)}}
.switch input:checked::after{{transform:translateX(16px);background:var(--paper)}}
.switch input:focus-visible{{outline:2px solid var(--ink);outline-offset:3px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));border-left:1px solid var(--ink)}}
.card{{margin:0;background:var(--paper);border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);display:flex;flex-direction:column}}
.stage{{height:184px;display:grid;place-items:center;overflow:visible}}
figcaption{{padding:0 16px 14px;display:flex;flex-direction:column;gap:2px}}
.row{{display:flex;align-items:baseline;gap:10px;min-height:20px}}
.num{{font:500 12px/20px var(--mono);letter-spacing:.04em;min-width:22px}}
.name{{font:600 14px/20px var(--sans);white-space:nowrap}}
.src{{margin-left:auto;font:400 11px/20px var(--mono);white-space:nowrap}}
.desc{{font:400 13px/20px var(--sans);white-space:nowrap;padding-left:32px}}
.tag{{margin-left:auto;font:400 11px/20px var(--mono);letter-spacing:.04em;white-space:nowrap}}
.codes{{justify-content:flex-end;gap:8px;margin-top:4px}}
.css-btn{{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;background:none;border:1px solid var(--ink);color:var(--ink);padding:4px 8px;cursor:pointer}}
.css-btn:hover,.css-btn:focus-visible{{background:var(--ink);color:var(--paper);outline:none}}
.secbar{{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 24px;padding:26px 32px 18px;border-bottom:2px solid var(--ink)}}
.secbar h2{{margin:0;font:600 18px/1.2 var(--sans);letter-spacing:-.01em}}
.secbar p{{margin:0;font:400 12px/1.5 var(--mono)}}
.grid + .secbar{{border-top:1px solid var(--ink)}}
footer{{padding:20px 32px 40px;font:400 12px/1.7 var(--mono)}}
footer p{{margin:0}}
dialog{{border:2px solid var(--ink);padding:0;max-width:min(720px,calc(100vw - 32px));width:100%;background:var(--paper);color:var(--ink)}}
dialog::backdrop{{background:rgba(0,0,0,.4)}}
dialog .dhead{{display:flex;align-items:baseline;gap:12px;padding:16px 20px;border-bottom:1px solid var(--ink)}}
dialog .dhead b{{font:600 16px/1.2 var(--sans)}}
dialog .dhead span{{font:400 12px/1.2 var(--mono)}}
dialog pre{{margin:0;padding:20px;font:400 12px/1.55 var(--mono);white-space:pre;overflow:auto;max-height:60vh;tab-size:2}}
dialog .dfoot{{display:flex;gap:16px;padding:16px 20px;border-top:1px solid var(--ink);justify-content:flex-end}}
@media (max-width:640px){{header{{padding:20px 16px 16px}} header .controls{{margin-left:0;width:100%}} footer{{padding:16px}}}}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <filter id="goo" x="-50%" y="-100%" width="200%" height="300%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/>
    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
  </filter>
</svg>

<header>
  <h1>Button Hover Specimens</h1>
  <span class="spec">{TOTAL} specimens, {len(PRESS)} press states, one base: Inter 600 14px, 160 x 48, 2px rule, black on white</span>
  <div class="controls">
    <label class="switch"><input type="checkbox" id="hoverAll"> Hover all</label>
    <label class="switch"><input type="checkbox" id="pressAll"> Press all</label>
    <label class="switch"><input type="checkbox" id="slow"> Slow motion</label>
  </div>
</header>

{SECTIONS_HTML}
<footer>
  <p>Rules: <a href="https://balsamiq.com/blog/button-design-best-practices/">Balsamiq, Button design best practices</a>. Sources: <a href="{ARTICLE}">TestMu AI, CSS button hover effects</a>, pens by ocxigin; <a href="{MENUHOVER}">MenuHover, button hover styles</a>.</p>
  <p>Pointer-reactive specimens run one shared pointermove listener and a damped spring per value, so every effect settles instead of snapping, and <code>prefers-reduced-motion</code> disables the engine entirely.</p>
  <p>Press states: {len(PRESS)} specimens also respond to the pointer going down. Each press is that specimen's own hover taken further, completed, reversed part way or flipped, held while down, back to the hover on release. Space and Enter press the same way.</p>
  <p>Rest state is identical for every specimen. Label stays legible on every frame via mix-blend-mode: difference. Greys occur only inside shadows.</p>
</footer>

<dialog id="cssDialog">
  <div class="dhead"><b id="dTitle"></b><span id="dSub"></span></div>
  <pre id="dCode"></pre>
  <div class="dfoot">
    <button type="button" class="fx fx-invert" id="dCopy"><span class="label">Copy</span></button>
    <button type="button" class="fx fx-invert" id="dClose"><span class="label">Close</span></button>
  </div>
</dialog>

<script src="pointer.js"></script>
<script>
(function(){{
  var all=document.querySelectorAll('main .fx'),hoverAll=document.getElementById('hoverAll'),pressAll=document.getElementById('pressAll');
  function states(){{
    var h=hoverAll.checked||pressAll.checked,p=pressAll.checked;
    all.forEach(function(b){{b.classList.toggle('hov',h);b.classList.toggle('act',p)}});
  }}
  hoverAll.addEventListener('change',states);
  pressAll.addEventListener('change',states);
  document.getElementById('slow').addEventListener('change',function(e){{
    document.documentElement.style.setProperty('--dur',e.target.checked?4:1);
  }});
  function pretty(t){{
    return t.replace(/\\s*\\{{\\s*/,' {{\\n  ').replace(/;\\s*(?=[^}}]*\\S)/g,';\\n  ').replace(/;?\\s*\\}}\\s*$/,';\\n}}');
  }}
  function markup(fig){{
    var el=fig.querySelector('.stage').firstElementChild.cloneNode(true);
    el.querySelectorAll('[style]').forEach(function(n){{n.removeAttribute('style')}});
    el.querySelectorAll('[data-gen]').forEach(function(n){{n.innerHTML='';n.removeAttribute('data-gen')}});
    el.removeAttribute('style');el.classList.remove('hov');
    return el.outerHTML.replace(/>(?=<(?!\\/))/g,'>\\n').replace(/ aria-hidden="true"/g,'');
  }}
  function cssFor(id,fig){{
    var base=[],own=[],mine=new RegExp('\\\\.fx-'+id+'(?![\\\\w-])');
    function walk(rules){{
      for(var r=0;r<rules.length;r++){{
        var rule=rules[r];
        if(rule.selectorText){{
          var sel=rule.selectorText;
          if(/^\\.fx(?![-\\w])/.test(sel)&&sel.indexOf('.fx-')<0)base.push(pretty(rule.cssText));
          else if(mine.test(sel)||(id==='goo'&&sel.indexOf('.goo')===0))own.push(pretty(rule.cssText));
        }}else if(rule.cssRules&&rule.type!==7){{
          if(mine.test(rule.cssText))own.push(rule.cssText);            /* @media, @supports, @starting-style wrapping our rules */
        }}else if(mine.test(rule.cssText)||(rule.name&&rule.name.indexOf(id)>=0)){{
          own.push(rule.cssText);                                        /* @keyframes, @property named for this effect */
        }}
      }}
    }}
    for(var s=0;s<document.styleSheets.length;s++){{
      var rules;try{{rules=document.styleSheets[s].cssRules}}catch(err){{continue}}
      if(rules)walk(rules);
    }}
    var out='<!-- markup -->\\n'+markup(fig)+'\\n\\n/* base */\\n'+base.join('\\n')+'\\n\\n/* effect */\\n'+own.join('\\n');
    if(id==='goo')out+='\\n\\n/* add this filter once */\\n'+document.querySelector('#goo').parentNode.outerHTML.replace(/^\\s+/gm,'');
    return out.replace(/:is\\(:hover, \\.hov\\)/g,':hover').replace(/:is\\(:active, \\.act\\)/g,':active');
  }}
  function jsFor(id){{
    var pf=window.PFX&&window.PFX[id];if(!pf)return '';
    var out='/* pointer.js: one window pointermove listener feeds read(), which fills s with\\n   lx ly (pointer in the button), nx ny (-1..1), dx dy (from centre), vx vy spd,\\n   near (0..1 within reach), inside, entry exit, ex ey eth, down held pressure,\\n   focused fdir kdown. frame() runs each animation frame; step(spring, k, damping)\\n   integrates one value toward its target. */\\n\\n';
    if(pf.reach)out+='reach: '+pf.reach+'  /* px outside the box where the response begins */\\n';
    out+='frame: '+String(pf.frame).replace(/\\n    /g,'\\n');
    ['init','enter','down','up','cancel','focus','blur','key','keydown','keyup'].forEach(function(h){{if(pf[h])out+='\\n'+h+': '+String(pf[h]).replace(/\\n    /g,'\\n')}});
    return out;
  }}
  var dlg=document.getElementById('cssDialog'),code=document.getElementById('dCode');
  document.querySelectorAll('.css-btn').forEach(function(btn){{
    btn.addEventListener('click',function(){{
      var fig=btn.closest('.card'),id=fig.dataset.id,js=btn.dataset.kind==='js';
      document.getElementById('dTitle').textContent=fig.querySelector('.name').textContent;
      document.getElementById('dSub').textContent=js?'pointer.js':'.fx-'+id;
      code.textContent=js?jsFor(id):cssFor(id,fig);
      dlg.showModal();
    }});
  }});
  document.getElementById('dClose').addEventListener('click',function(){{dlg.close()}});
  document.getElementById('dCopy').addEventListener('click',function(){{
    var lbl=this.querySelector('.label');
    navigator.clipboard.writeText(code.textContent).then(function(){{lbl.textContent='Copied';setTimeout(function(){{lbl.textContent='Copy'}},1200)}});
  }});
  dlg.addEventListener('click',function(e){{if(e.target===dlg)dlg.close()}});
}})();
</script>
</body>
</html>
'''
(HERE / "index.html").write_text(PAGE)
print(f"wrote index.html with {TOTAL} specimens: " + SPEC)
