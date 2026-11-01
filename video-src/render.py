import asyncio, sys, os
from playwright.async_api import async_playwright
W,H,OUT=int(sys.argv[1]),int(sys.argv[2]),sys.argv[3]
FR=[int(x) for x in sys.argv[4].split(',')] if len(sys.argv)>4 else None
FPS=30; NSITE=1170; TOTAL=41.0
os.makedirs(OUT,exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':W,'height':H},device_scale_factor=1)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/promo/promo_built.html'); await pg.wait_for_timeout(1500)
        frames=FR if FR else range(int(TOTAL*FPS))
        for f in frames:
            sf=min(f,NSITE-1)
            await pg.evaluate(f"frame({f/FPS:.4f},'site/{sf:05d}.jpg',{TOTAL})")
            await pg.screenshot(path=f'{OUT}/{f:05d}.jpg',type='jpeg',quality=93)
            if f%60==0: print(f,flush=True)
        print(errs)
        await b.close()
asyncio.run(main())
