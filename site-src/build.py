"""Builds ONE self-contained index.html (works offline, on GitHub Pages, on any host)."""
import base64, json, io, os, sys
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
R = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(D)      # repo folder
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(R, 'index.html')
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()

fonts = ''
for fam, f, style in [('Inter', 'inter.woff', 'normal'), ('Cormorant', 'corm.woff', 'normal'), ('Cormorant', 'corm-i.woff', 'italic')]:
    fonts += f'@font-face{{font-family:"{fam}";src:url(data:font/woff;base64,{b64(os.path.join(D, "fonts", f))}) format("woff");font-weight:300 900;font-style:{style};font-display:swap}}\n'

imgs = []
for frame, cap in [(0, 'Reception'), (2724, 'Strategy room'), (3150, 'Board room')]:
    p = os.path.join(R, 'media/stops/stop-%d-m.jpg' % frame)
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert('RGB'); w, h = im.size
    im = im.crop(((w - h * 4 // 5) // 2, 0, (w + h * 4 // 5) // 2, h)).resize((560, 700), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=82, optimize=True, progressive=True)
    imgs.append({'src': 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), 'cap': cap})

P = json.load(open(os.path.join(R, 'src/P.json')))
content = open(os.path.join(R, 'src/content.js')).read().replace('__PDATA__', json.dumps(P, ensure_ascii=False))
html = open(os.path.join(D, 'src/shell.html')).read()
for k, v in [('__FONTS__', fonts), ('__CSS__', open(os.path.join(D, 'src/style.css')).read()),
             ('__THREE__', open(os.path.join(D, 'src/three.bundle.js')).read()),
             ('__SHAPES__', open(os.path.join(D, 'logo_shapes.json')).read()),
             ('__IMGS__', json.dumps(imgs)), ('__CONTENT__', content),
             ('__APP__', open(os.path.join(D, 'src/app.js')).read()),
             ('__LOGO__', b64(os.path.join(R, 'assets/logo-star.png')))]:
    html = html.replace(k, v)
open(OUT, 'w').write(html)
print(OUT, len(html), 'bytes,', len(imgs), 'office photos')
