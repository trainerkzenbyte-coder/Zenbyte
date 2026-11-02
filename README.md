# Zenbyte Technologies — 3D IT office website

**Your Bridge to IT Careers.**

`index.html` is a full 3D IT office with animated people. Every chapter of your content takes you to a different part of the office:

| Chapter | Where you are | What the people are doing |
|---|---|---|
| Welcome | Reception with the Zenbyte logo wall | Receptionist at the desk, a handshake, visitors walking in |
| Our record | Data wall | A presenter explains the live placement chart to the team, one sips coffee |
| Your journey | Coding floor | Developers typing at desks with live code on their screens, a lead walking the floor |
| Visits and timing | Meeting room | Team seated around the table, a presenter at the screen |
| Fees | Coffee break area | People with coffee cups chatting and laughing |
| Policies | Manager cabin | A one-to-one discussion across the desk |
| Rewards and next steps | Celebration | An offer handshake, the team clapping, gold confetti |

- **Look around:** drag with the mouse (or a finger) to rotate the view. Moving the mouse also turns the view gently. Double-click resets it.
- **Change pages:** use the arrows, the scroll wheel, the arrow keys, the chapter buttons or the dots.
- **One self-contained file:** works on GitHub Pages, any host, or offline.

## Change text
Edit `src/P.json`, then run `python3 office-src/build.py`.

## How it is made (all free)
- three.js (MIT) for the 3D.
- The animated people are the free "X Bot" character from Mixamo, as included in the three.js examples. They are given different outfit colours, with poses for typing, handshakes, coffee, talking, presenting and clapping built in code.
- Fonts: Inter and Cormorant Garamond (SIL Open Font License).

**More realistic people (free):** sign in at mixamo.com with a free Adobe account and download characters in business clothes plus animations such as "Typing", "Shaking Hands", "Drinking" and "Talking" (FBX, then convert to GLB with the free Blender). They can replace the X Bot in `office-src/models/`.
