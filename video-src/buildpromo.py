import base64
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
F='/home/claude/site/fonts/'
fonts=''.join(f'@font-face{{font-family:"{fa}";src:url(data:font/woff;base64,{b64(F+f)}) format("woff");font-weight:300 900;font-style:{st}}}\n' for fa,f,st in [('Inter','inter.woff','normal'),('Cormorant','corm.woff','normal'),('Cormorant','corm-i.woff','italic')])
s=open('/home/claude/promo/promo.html').read().replace('__FONTS__',fonts).replace('__THREE__',open('/home/claude/site/src/three.bundle.js').read()).replace('__LOGO__',b64('/home/claude/zenbyte/assets/logo-star.png'))
open('/home/claude/promo/promo_built.html','w').write(s)
