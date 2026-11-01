# Zenbyte Technologies — Website

**Your Bridge to IT Careers.**

A walk through the real Zenbyte office:

1. **Logo first**: the Zenbyte logo glows over a soft, blurred view of the office entrance, with the company name, quotes and a dark **Enter Zenbyte** button (one tap works on mobile).
2. **Walk room by room**: you walk through the office (your own walkthrough video, cleaned up and sharpened) to a computer. The computer rises into view, the camera zooms into its screen, and the screen becomes the full page.
3. **Next page**: the page zooms back into the computer, you walk on to the next desk, and the next page opens the same way.

Rooms: Reception → MD cabin → Waiting lounge → Interview corner → Counselling cabin → Café → Front office → Future corridor → Glass lounge → AI Innovation Room → Conference room → Board room.

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
| `src/P.json` | Your page text (titles, cards, notes). Edit text here. |
| `src/main.js` | The walk: which video seconds lead to which desk (`SEG`), walking speed (`RATE`), quotes (`QUOTES`) |
| `src/content.js` | Chapter list and page layouts |
| `src/style.css` | Look of the logo screen, computer, pages and menu |
| `src/shell.html` | Page skeleton |
| `src/build.py` | Rebuilds `index.html` from the `src` files |

**To change text, quotes or where each walk stops:** edit the file in `src/`, then run:

```
python3 src/build.py
```

**To use a new office video:** replace the two files in `media/` (same names) and adjust the seconds in `SEG` in `src/main.js`.
