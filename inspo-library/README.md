# ✿ Inspo Library

A local design-inspiration library for the screenshots, graphics and videos in `../to-dew-inspo`.

## Run

```bash
cd inspo-library
node server.js            # → http://localhost:4747
```

No `npm install` needed (plain Node, v18+). `ffmpeg` is used for video thumbnails if it's installed (`brew install ffmpeg`).

To turn on automatic analysis of new images (tags, families, image prompt, design brief):

```bash
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

Options: `PORT=5000`, `INSPO_DIR=/some/other/folder`, `INSPO_MODEL=claude-opus-4-1`.

## Using it

- **Browse** – masonry gallery; hover a video to play it. `/` focuses search; `←` `→` step through items; `Esc` closes.
- **Filter** – click a family chip. The panel under the chips explains what defines that style (typography, layout, color, texture, motion) and has *Copy family brief*.
- **Detail view** – click any card: keywords, families (toggle), *Why I saved this* notes (autosaves), optional live-site URL, **Copy Image Prompt**, **Copy Brief**. Title, prompt and brief are editable in place.
- **Add** – drag & drop anywhere, paste from clipboard, the *+ Add* button, or drop files into the folder and press **Rescan**.
- **Analyze** – new items show a NEW badge. With an API key set, *Analyze with Claude* (per item) or *✦ Analyze new* (all) fills everything in and may propose a new family if nothing fits.
- **Families** – *+ new family* in the detail view, or *Edit* / *Delete family* in the family panel.

## Files

- `library.json` – all metadata (families, tags, prompts, briefs, notes, URLs). Back this up; it's the whole library.
- `.cache/` – video poster frames.
- `seed/build-seed.js` – the initial hand-written analysis of the first 29 items (`node seed/build-seed.js --force` resets to it).
