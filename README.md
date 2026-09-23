# Instagram Carousel Builder

Build Instagram carousels in the browser: drop in images or video, lay out text, pick a style, preview it on a phone, and export every slide. Everything runs locally; your work is saved in your browser.

## Features

- **Slides:** cover, image + caption, video, panorama (one wide image split across slides), 2/3/4-image grids, text, quote, numbered list, before/after and call to action. Up to 20 slides, with add, duplicate, delete and drag-to-reorder.
- **Sizes:** portrait 4:5, tall 3:4 and square 1:1.
- **Style:** six presets, ten font pairings, heading weight/size/spacing, colours, title effects, image overlay strength, and matching colours to your cover image.
- **Per slide:** drag text anywhere or snap it, pan and zoom images, brightness/saturation/warmth/vignette, stickers and shapes, and alt text.
- **Swipe cues:** slide numbers, progress dots and a swipe arrow.
- **Brand kit:** save your handle, style and logo watermark; new projects start from it.
- **Projects:** autosave, undo/redo, save/open project files, starter and saved templates, spreadsheet/CSV text import, and share links.
- **Caption:** writer with character and hashtag counts.
- **Preview:** a swipeable phone mockup of the post and your profile grid.
- **Export:** a zip of JPG or PNG slides (video slides as MP4/WebM, plus caption and alt text files), single slides, or a PDF for LinkedIn document posts.
- **AI suggestions (optional):** slide titles, captions and alt text from Claude using your own Anthropic API key, which is stored only in your browser.
- **Keyboard shortcuts:** press `?` in the app to see them.

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check, then build dist/index.html (single file, opens from disk)
npm run typecheck
```

## Layout

```
src/
  main.ts, App.vue       entry, page layout, global shortcuts
  constants.ts           sizes and limits
  types.ts               Project, Slide, Theme and friends
  shortcuts.ts           shortcut list and helpers
  model/                 plain data logic, no Vue
    factory.ts           new slides and projects
    slideTypes.ts        what each slide type offers
    normalize.ts         validating saved/opened/shared projects
    presets.ts, templates.ts, textLayout.ts, panorama.ts, stickers.ts, csv.ts
  stores/                Pinia stores
    project.ts           the project and every edit to it
    assets.ts            decoded images and videos
    history.ts           undo/redo
    brand.ts, templates.ts, ai.ts
  render/                canvas drawing, no Vue
    index.ts             renderSlide() and the renderer for each slide type
    slides/              one file per slide type
    text.ts              text fitting and the movable text block
    draw.ts, style.ts, geometry.ts, cues.ts, stickers.ts, palette.ts
  export/                zip, PDF, video recording, downloads
  persist/               IndexedDB, project files, share links
  fonts/                 font pairings and loading
  ai/claude.ts           Claude suggestions
  components/            Vue components (sidebar panels in components/sidebar/)
```

To add a slide type, add it to `SlideType` in `types.ts` and describe it in `model/slideTypes.ts`, add its sample text and text position in `model/factory.ts` and `model/textLayout.ts`, then write a renderer in `render/slides/` and register it in `render/index.ts`.
