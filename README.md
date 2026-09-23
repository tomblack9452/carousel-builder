# Carousel builder

Build Instagram carousel slides (1080×1350 JPG) in the browser: drop in screenshots, position them, add titles, export a zip.

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
  main.ts              app entry
  App.vue              page layout, web-font loading
  constants.ts         export size, fonts, limits
  types.ts             Slide, Settings, RenderDoc
  stores/project.ts    all app state and actions (Pinia)
  components/
    AppSidebar.vue     global settings, bulk load, download all
    SlideGrid.vue      list of slide cards
    SlideCard.vue      one slide: preview, inputs, zoom, buttons, drop target
    SlideCanvas.vue    live canvas preview, drag/keyboard panning
  render/              pure canvas drawing, no Vue
    index.ts           renderSlide() + renderer per slide type
    draw.ts            text fitting, shading, handle
    geometry.ts        image fit/zoom/pan maths
    slides/            cover.ts, game.ts, end.ts
  export/files.ts      JPEG encoding, zip, file names, download
  styles/main.css      colour tokens and shared styles
```

To add a slide type, add it to `SlideType` in `types.ts`, write a renderer in `render/slides/`, and register it in `render/index.ts`.
