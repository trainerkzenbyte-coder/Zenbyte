# Zenbyte Technologies — Website and promo video

**Your Bridge to IT Careers.**

## The website (`index.html`)

A cinematic, scroll-driven website, in the style of premium brand showcase sites.

- **One self-contained file.** `index.html` contains everything: the 3D engine (three.js), the fonts, your logo and the office photos. It works on GitHub Pages, on any web host, or opened straight from your computer, even offline.
- **3D studio behind the page.** A dark studio sits behind everything, with a light beam, floating dust and reflections. Your Zenbyte logo is made in 3D: it was traced from your logo file and given glossy blue faces and gold edges.
- **Scrolling tells the story.** As you scroll, the 3D scene changes for each part of the content:
  - **Our record:** a 3D bar chart of offers per month, blue for 2025 and gold for 2026.
  - **Your journey:** a "bridge" of gold light with 5 glowing steps. Each step lights up as you read about it.
  - **Our offices:** three light pillars, for Chennai, Coimbatore and Bengaluru, plus real photos of your office.
  - **Fees and Policies:** gold rings orbit the logo.
  - **Rewards and Thank you:** a gold burst.
- **All your content is included.** All 23 pages are arranged in 7 chapters, and each chapter opens with a title moment.
- **Mobile:** the 3D scene sits at the top, the text scrolls below it, and a menu button gives chapter links.

### To change the text
Edit `src/P.json` for the page text, or `site-src/src/app.js` for the chapter titles and quotes, then run:

```
python3 site-src/build.py
```

## The promo video (`promo/zenbyte-promo-vertical.mp4`)

- **Format:** a 1080×1920 vertical video, about 41 seconds long, for Instagram Reels, YouTube Shorts and WhatsApp Status.
- **What it shows:** a 3D laptop on a wooden desk, with the website scrolling on its screen. Gold captions appear at the top, and it ends on a logo card.
- **Sound:** none. Add music in Instagram, CapCut or any free editor.

The video is made from the website in `video-src/`:
1. `cap_site.py` records the site frame by frame.
2. `render.py` renders the laptop scene around those frames.
3. ffmpeg joins the frames into the video.

## Files

| File | What it is |
|---|---|
| `index.html` | The website: one self-contained file |
| `src/P.json`, `src/content.js` | Your page text and layouts |
| `site-src/` | Website source (3D scene, style, fonts, logo outline) and `build.py` |
| `video-src/` | Promo video source |
| `promo/` | Finished promo video |
| `media/stops/` | AI-upscaled photos of your office (Real-ESRGAN) |
| `assets/` | Logo files |

Everything here is free: three.js (MIT), the Inter and Cormorant Garamond fonts (SIL Open Font License), Real-ESRGAN (BSD), ffmpeg, and GitHub Pages.
