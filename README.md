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

- **360° view:** drag with the mouse (or a finger) to turn all the way round. Moving the mouse also turns the view gently, the **360°** button spins it slowly by itself, and double-click resets it.
- **Both sides of every room:** the opposite wall has a big screen in each zone, with people watching it. The screens show the welcome screen, skills in demand, live code, a client video call, hiring news, offer letters and "Placed this month".
- **People:** men in formal shirts and trousers, women in T-shirts and jeans, everyone wearing a Zenbyte ID card on a lanyard.
- **Change pages:** use the arrows, the scroll wheel, the arrow keys, the chapter buttons or the dots.
- **One self-contained file:** works on GitHub Pages, any host, or offline.

## Change text
Edit `src/P.json`, then run `python3 office-src/build.py`.

## How it is made (all free)
- three.js (MIT) for the 3D.
- **People:** two base characters, dressed in code in 14 outfit styles. Their poses for typing, handshakes, coffee, talking, presenting, clapping, walking and watching are all made in code.
  - **Woman:** "mpfb" by Mika Suominen, made with MakeHuman/MPFB, from the TalkingHead project. Licensed CC0.
  - **Man:** "rpm" from the Babylon.js Assets repository. Licensed CC BY 4.0, credit: Babylon.js.
- `office-src/slim_glb.py` shrinks the character files for the web.
- Fonts: Inter and Cormorant Garamond (SIL Open Font License).
