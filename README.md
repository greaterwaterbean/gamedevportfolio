# Luke Bonniwell — Portfolio

Static site, no build step, no framework. Plain HTML/CSS/JS so it deploys straight to GitHub Pages and is easy to hand-edit.

## Structure

```
index.html                     homepage (about, skills, projects, devlog feed, contact)
projects/                       one HTML file per game
css/style.css                   the entire design system
css/game.css, js/game.js        the homepage game layer (see "Game layer" below)
js/main.js                      nav toggle, missing-image fallback, active nav highlight, contact form
img/projects/<slug>/            per-project images (see img/README.md for expected filenames)
img/ui/, img/icons/             pixel-art UI assets (buttons, badges, icons) — see CREDITS.md
img/sprites/                    animated pixel sprites for the game layer — see CREDITS.md
audio/                          opt-in game-layer sound effects — see CREDITS.md
img/site/favicon.svg            tab icon
resume/                         drop your resume PDF here (see resume/README.md)
404.html                        "GAME OVER" page GitHub Pages shows for missing URLs
credits.html, CREDITS.md        attribution for every asset pack used
```

## Design system

Dark warm background with hand-drawn "pinned to a corkboard" cream cards, hard offset pixel-shadows on buttons/badges, and a hand-lettered accent font (Caveat) — built around Crusenho's free itch.io UI packs. Colors, buttons, badges, and card styling all live in `css/style.css` as CSS custom properties at the top of the file if you want to retheme.

### Game layer

The homepage carries an optional game layer: animated pixel sprites, small interactions, achievements, and opt-in sound, all built from free itch.io asset packs (see `credits.html`). It lives entirely in `css/game.css`, `js/game.js`, `img/sprites/`, and `audio/`; `css/style.css` and `js/main.js` don't depend on it.

Each piece is switched on by a word in `<body data-fx="...">` in `index.html`. Delete a word to turn that piece off; delete the `css/game.css` link and the `js/game.js` script tag to drop the whole layer.

| Word | What it adds |
| --- | --- |
| `player-one` | Knight with a bobbing "P1" tag standing on the hero photo card |
| `p1-emotes` | The knight pops an emote bubble (!, ?, heart, ...) every few seconds |
| `idle-zzz` | Leave the page alone for 20s and the knight dozes off |
| `sparkles` | Twinkling glints on the hero (name, photo card, View Projects) |
| `typewriter` | The hero terminal line types itself out |
| `flyby` | A bat crosses the hero every ~20 seconds |
| `boot-screen` | A one-second "LOADING..." screen, once per browser session (any key/tap skips) |
| `menu-cursor` | A blinking pixel pointer next to the active nav link |
| `xp-bar` | Scroll-progress XP bar under the header, an LV counter, and "LEVEL UP!" per new section |
| `sfx` | "SFX" tab under the header; sound effects stay off until the visitor turns them on |
| `achievements` | Trophy tab under the header plus 11 achievements with pop-up toasts |
| `click-fx` | A small spark wherever the visitor clicks or taps |
| `cursor` | Pixel sword cursors (mouse users only) |
| `konami` | ↑↑↓↓←→←→BA (or 5 quick taps on the Devlog logbook): 10-second party mode |
| `section-flags` | Waving flags next to the section headings |
| `inv-shine` | Shine sweep on the Tools of the Trade inventory slots; items bob on hover |
| `butterflies` | Two butterflies over Tools of the Trade (one on phones) |
| `nap-cat` | A cat asleep on the About card; click to wake it |
| `crt` | Scanlines and flicker on the terminal cards |
| `shipped-flags` | Waving flags instead of dots in the Games Made list |
| `critters` | Idle monsters perched on the three project cards |
| `critter-react` | Critters hop and show "!" when their card is hovered |
| `combat` | Click a critter: slash, damage numbers, HP bar; 3 hits and it poofs, then respawns |
| `press-start` | "PRESS START" over project key art on hover |
| `pet-snow` | Snow falling over the Project P.E.T. key art |
| `rat-run` | Mice scurry along the top of the Tails of the Tower card now and then |
| `quest-stamps` | "QUEST COMPLETE" / "QUEST ACTIVE" stamps land on the Experience cards |
| `d20` | A d20 on the Dungeon Master card to roll (a 20 is guaranteed by the 10th roll) |
| `fountains` | Lava fountains flanking the Devlog logbook |
| `crow` | A crow perched on the logbook; click to startle it |
| `campfire` | A "SAVE POINT" campfire by the Contact heading |
| `coin-hunt` | 6 hidden coins, a header counter, and a chest in Contact that opens when all 6 are found |
| `lever` | A lever by "Back to top" in the footer |
| `patrol` | Knight running back and forth along the footer |

`404.html` is a separate "GAME OVER" page (with a continue countdown back home) that GitHub Pages shows for any missing URL.

Performance: sections scrolled off screen pause all their animations, motion uses transform/opacity only, phones get fewer particles, and `prefers-reduced-motion` turns the motion off. Progress (coins, achievements, the sound setting) is kept in `localStorage`.

## Running it locally

No server needed — just open `index.html` in a browser. If links act up because of `file://` restrictions, run a quick local server from this folder instead:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Filling in placeholders

- Any image that doesn't exist yet shows a dashed box telling you the exact filename and size it's expecting. Drop the file in with that name and the placeholder disappears — no HTML edits required.
- Every project page has paragraphs that literally say "write about X here" inside the prose. Search each file for those and replace them with real writeups.
- `resume/README.md` explains where to put your resume PDF.

## Adding a 7th project

1. Copy `projects/in-progress-2.html` (or any existing project page) to `projects/your-new-game.html`.
2. Find-and-replace the title, tagline, meta facts, links, and devlog entries.
3. Make an `img/projects/your-new-game/` folder and drop in images using the naming pattern in `img/README.md`.
4. Add a new `<article class="project-card">` block to the projects grid in `index.html` (copy an existing one as a starting point).
5. Update the `next-project` link at the bottom of whichever page should now point to the new one, and point the new page's `next-project` link at whatever came after it.

Adding a new devlog entry to an existing project: duplicate one `<article class="devlog-entry">...</article>` block inside that project's `#devlog` section, give it a unique `id` (e.g. `log-2026-09-01`), and fill it in. Newest entries go at the top.

## Deploying on GitHub Pages

1. Push this repo to `main` on GitHub (it's already connected to `github.com/Lukebonn/Portfolio`).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. The site goes live at `https://lukebonn.github.io/Portfolio/` within a minute or two.

## Adding a custom domain

1. Buy the domain from any registrar (Namecheap, Google Domains successor, etc.).
2. At the registrar, add a **CNAME record** pointing your subdomain (e.g. `www`) at `lukebonn.github.io`, or **A records** for the apex domain pointing at GitHub's IPs (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`).
3. In this repo, create a file named `CNAME` (no extension) at the root containing just your domain, e.g. `luke-bonniwell.dev`.
4. In **Settings → Pages**, enter the same custom domain and enable **Enforce HTTPS** once it's available.

All internal links in this site use relative paths (`css/style.css`, not `/css/style.css`), so it works correctly both at `lukebonn.github.io/Portfolio/` and at a custom domain root without any changes.
