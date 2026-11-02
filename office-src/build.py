import base64, json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
R = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(D)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(R, 'index.html')
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
F = os.path.join(D, 'fonts')
fonts = ''.join(f'@font-face{{font-family:"{fa}";src:url(data:font/woff;base64,{b64(os.path.join(F, f))}) format("woff");font-weight:300 900;font-style:{st};font-display:swap}}\n'
                for fa, f, st in [('Inter', 'inter.woff', 'normal'), ('Cormorant', 'corm.woff', 'normal'), ('Cormorant', 'corm-i.woff', 'italic')])
P = json.load(open(os.path.join(R, 'src/P.json')))
content = open(os.path.join(R, 'src/content.js')).read().replace('__PDATA__', json.dumps(P, ensure_ascii=False))
html = open(os.path.join(D, 'src/shell.html')).read()
for k, v in [('__FONTS__', fonts), ('__CSS__', open(os.path.join(D, 'src/style.css')).read()),
             ('__THREE__', open(os.path.join(D, 'src/three.bundle.js')).read()),
             ('__XBOT__', b64(os.path.join(D, 'models/Xbot.glb'))), ('__CONTENT__', content),
             ('__APP__', open(os.path.join(D, 'src/app.js')).read()), ('__LOGO__', b64(os.path.join(R, 'assets/logo-star.png')))]:
    html = html.replace(k, v)
open(OUT, 'w').write(html); print(OUT, len(html))
