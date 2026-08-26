Every image the site expects is listed below. Nothing breaks if a file is missing — the page just shows a dashed placeholder box with the expected filename and size until you add the real image. Match the filename exactly and the placeholder disappears automatically, no HTML edits needed.

## Site

- `img/site/favicon.svg` — already in place, replace if you want your own mark.
- `img/ui/` and `img/icons/` — real pixel-art assets (buttons, badges, the devlog book graphic, inline icons), not placeholders. Sourced from Crusenho's free itch.io UI packs — see `/credits.html` or `CREDITS.md` for attribution. Leave these as-is unless you're intentionally restyling.

## Per project (repeat this pattern for any new project folder)

Recommended sizes: card `1200x675`, cover `1920x1080`, gallery/devlog shots any 16:9-ish size.

- `img/projects/<project>/card.jpg` — thumbnail used on the homepage project grid.
- `img/projects/<project>/cover.jpg` — large hero image at the top of the project page.
- `img/projects/<project>/shot-01.jpg`, `shot-02.jpg`, ... — gallery screenshots.
- `img/projects/<project>/log-*.jpg` — one optional image per devlog entry (filenames referenced in each entry, e.g. `log-2026-05-14.jpg`).

Existing project folders: `tails-of-the-tower`, `whispers-through-the-halls`, `project-pet`, `wildshape`, `unreal-soulslike`, `in-progress-2`.

To add a 7th project, make a new folder here named after the project's URL slug (e.g. `img/projects/my-new-game/`) and drop in the same set of files.
