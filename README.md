# Zenbyte Technologies — 3D Website

**Your Bridge to IT Careers.**

A cinematic, fully 3D website:

1. **Space intro**: stars light up one by one across the sky. One star ignites over a real NASA Earth, and its light beam reaches a person standing on the planet. The person rises into the star, and the Zenbyte logo is born from the light, followed by the company name and quotes.
2. **The Zenbyte office**: press **Enter Zenbyte**, fly into the star, and arrive at the office entrance. Automatic glass doors open as you walk, and each chapter is its own room:
   Welcome (lobby) → Our record → Your journey → Visits and timing → Fees → Policies → Rewards and next steps.

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
| `src/main.js` | The 3D engine: space scene, office rooms, doors, camera walk |
| `src/style.css` | Look of the text panels, menu and intro |
| `src/shell.html` | Page skeleton |
| `src/build.py` | Rebuilds `index.html` from the `src` files |
| `assets/` | Logo files |

**To change text:** edit `src/P.json` (or the `QUOTES` list at the top of `src/main.js`), then run:

```
python3 src/build.py
```

This writes a fresh `index.html`.

## Hosting (free)

GitHub Pages: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
The site appears at `https://trainerkzenbyte-coder.github.io/zenbyte/`.

The site needs an internet connection to load the 3D engine (three.js) and the Earth photos from the jsDelivr CDN.
