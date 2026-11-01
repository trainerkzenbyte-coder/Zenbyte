# Zenbyte Technologies — 3D Website

**Your Bridge to IT Careers.**

A cinematic, fully 3D website:

1. **Space intro**: stars light up one by one across the sky. One star ignites over a real NASA Earth, and its light beam reaches a person standing on the planet. The person rises into the star, and the Zenbyte logo is born from the light, followed by the company name and quotes.
2. **The real Zenbyte office**: press **Enter Zenbyte** and fly into the star. Frosted glass doors with the Zenbyte logo open, and you walk into a real office filmed on video, with real people working. Each chapter is its own room, and every page moves you to a new spot inside it:
   Welcome → Our record → Your journey → Visits and timing → Fees → Policies → Rewards and next steps.
   **To use your own office videos**, see [`videos/README.md`](videos/README.md).

## How to use

- Scroll, use the arrow keys, swipe on mobile, or use the ↑ ↓ buttons to move between pages.
- Click a room name in the top menu to walk straight there.
- Click or press Space during the intro to skip it.
- Add `#office` to the end of the address to skip the space intro.

## Files

| File | What it is |
|---|---|
| `index.html` | **The whole website** in one file. This is what visitors open. |
| `src/content.js` | Room list and page renderers |
| `src/P.json` | Your page text (titles, cards, notes). Edit text here. |
| `src/main.js` | Space 3D scene + real-video office (rooms, doors, walking) |
| `src/style.css` | Look of the text panels, menu and intro |
| `src/shell.html` | Page skeleton |
| `src/build.py` | Rebuilds `index.html` from the `src` files |
| `assets/` | Logo files |
| `videos/` | Your office videos (`room1.mp4` … `room7.mp4`) |

**To change text:** edit `src/P.json` (or the `QUOTES` list at the top of `src/main.js`), then run:

```
python3 src/build.py
```

This writes a fresh `index.html`.

## Hosting (free)

GitHub Pages: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
The site appears at `https://trainerkzenbyte-coder.github.io/zenbyte/`.

The site needs an internet connection to load the 3D engine (three.js), the Earth photos (jsDelivr CDN), and the free stock videos (Mixkit) for any room without its own video. Stock videos: [Mixkit](https://mixkit.co/), free license, no attribution required.
