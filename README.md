# Luke Bonniwell — Portfolio

Static site, no build step, no framework. Plain HTML/CSS/JS so it deploys straight to GitHub Pages and is easy to hand-edit.

## Structure

```
index.html                     homepage (about, skills, projects, devlog feed, contact)
projects/                       one HTML file per game
css/style.css                   the entire design system
js/main.js                      nav toggle, missing-image fallback, scroll reveal, active nav highlight
img/projects/<slug>/            per-project images (see img/README.md for expected filenames)
img/ui/, img/icons/             pixel-art UI assets (buttons, badges, icons) — see CREDITS.md
img/site/favicon.svg            tab icon
resume/                         drop your resume PDF here (see resume/README.md)
credits.html, CREDITS.md        attribution for the UI asset packs used
```

## Design system

Dark warm background with hand-drawn "pinned to a corkboard" cream cards, hard offset pixel-shadows on buttons/badges, and a hand-lettered accent font (Caveat) — built around Crusenho's free itch.io UI packs. Colors, buttons, badges, and card styling all live in `css/style.css` as CSS custom properties at the top of the file if you want to retheme.

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
