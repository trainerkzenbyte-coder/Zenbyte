# Zenbyte Technologies — Website

**Your Bridge to IT Careers.**

A walk through the real Zenbyte office:

1. **Logo first**: the Zenbyte logo glows over a soft, blurred view of the office entrance, with the company name, quotes and a dark **Enter Zenbyte** button (one tap works on mobile).
2. **Room by room**: you walk into each room of your office video and stop in front of a real screen in that room (TV, video wall, conference display). The page lights up on that screen, in the right perspective, then the camera zooms into the screen and the page opens full screen.
3. **Next page**: inside the same room the camera zooms back to the screen and it switches to the next page. When the chapter changes you walk on to the next room and its screen.

Rooms and screens: Reception (wall TV) → Glass lounge (TV) → Conference room (wall display) → Strategy room (wall display) → Innovation wall (video wall) → Board room (large display).

**Picture quality**: the original render is only 816×464. The workflow `.github/workflows/upscale.yml` upscales it 4× for free with the open-source AI model Real-ESRGAN on GitHub's own computers, and saves sharp HD frames for every screen stop in `media/stops/`.

## How to use

- Scroll, use the arrow keys, swipe left/right on mobile, or use the ↑ ↓ buttons to move between pages.
- Click a chapter name in the top menu to walk straight there.
- Add `#office` to the end of the address to skip the logo screen.

## Files

| File | What it is |
|---|---|
| `index.html` | **The whole website** in one file. This is what visitors open. |
| `media/walk-1080.mp4` | Your office walkthrough video (HD, for computers) |
| `media/walk-720.mp4` | Same video, smaller (for phones) |
| `media/poster.jpg` | First frame, shown while the video loads |
| `media/stops/` | Sharp AI-upscaled photo of each screen stop |
| `media/source/byte.mp4` | Your original video (input for the upscaler) |
| `src/P.json` | Your page text (titles, cards, notes). Edit text here. |
| `src/main.js` | The rooms (`ROOMS_3D`: walk, stop frame, screen corners), which page shows in which room (`PAGE_AT`), quotes (`QUOTES`) |
| `src/content.js` | Chapter list and page layouts |
| `src/style.css` | Look of the logo screen, computer, pages and menu |
| `src/shell.html` | Page skeleton |
| `src/build.py` | Rebuilds `index.html` from the `src` files |

**To change text, quotes or where each walk stops:** edit the file in `src/`, then run:

```
python3 src/build.py
```

**To use a new office video:** put it at `media/source/byte.mp4`, change any number in `.github/upscale/stills.txt` (the stop frames) so the upscaler runs again, and update `ROOMS_3D` in `src/main.js`.
