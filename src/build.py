import base64,json,sys
import os; d=os.path.dirname(os.path.abspath(__file__))+'/'
logo=base64.b64encode(open(d+'../assets/logo-star.png','rb').read()).decode()
P=json.load(open(d+'P.json'))
content=open(d+'content.js').read().replace('__PDATA__',json.dumps(P,ensure_ascii=False))
js=open(d+'main.js').read().replace('__CONTENT__',content)
html=open(d+'shell.html').read().replace('__CSS__',open(d+'style.css').read()).replace('__JS__',js).replace('__LOGO__',logo)
out=sys.argv[1] if len(sys.argv)>1 else d+'../index.html'
open(out,'w').write(html); print(out,len(html))
