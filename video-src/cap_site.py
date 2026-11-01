import asyncio, math, json
from playwright.async_api import async_playwright
FPS=30; MOVE=1.05; HOLD=1.75
STOPS=['top','c1','p1','p3','c2','p4','c3','p6','p8','p11','p12','p15','p20','p23']
def ease(t): return 4*t*t*t if t<.5 else 1-pow(-2*t+2,3)/2
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        c=await b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
        pg=await c.new_page()
        await pg.goto('http://localhost:8770/index.html?capture'); await pg.wait_for_timeout(2500)
        ys=[]
        for s in STOPS:
            y=0 if s=='top' else await pg.evaluate(f"sectionTop('{s}')+innerHeight*0.12")
            ys.append(y)
        # timeline
        keys=[]; t=0
        for k,y in enumerate(ys):
            if k>0: keys.append((t,ys[k-1],y,MOVE)); t+=MOVE
            keys.append((t,y,y,HOLD if k<len(ys)-1 else 2.6)); t+=HOLD if k<len(ys)-1 else 2.6
        total=t; n=int(total*FPS); print('frames',n,total,flush=True)
        json.dump({'frames':n,'fps':FPS,'stops':STOPS,'times':[k[0] for k in keys]},open('/home/claude/promo/site/meta.json','w'))
        for f in range(n):
            tt=f/FPS
            for (t0,a,bb,d) in keys:
                if t0<=tt<t0+d or (tt>=t0 and (t0,a,bb,d)==keys[-1]):
                    y=a+(bb-a)*ease(min(1,(tt-t0)/d)); break
            await pg.evaluate(f"renderAt({y:.1f},{tt:.4f})")
            await pg.screenshot(path=f'/home/claude/promo/site/{f:05d}.jpg',type='jpeg',quality=92)
            if f%60==0: print(f,flush=True)
        await b.close()
asyncio.run(main())
