import asyncio, sys, pathlib
from playwright.async_api import async_playwright
async def m(path):
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto(pathlib.Path(path).resolve().as_uri()); await pg.wait_for_timeout(400)
    await pg.evaluate("handleLogin('distributor', DATA.distributors[0].id)"); await pg.wait_for_timeout(200)
    for t in ['home','lookup','newclaim','register','history']: await pg.evaluate(f"switchDistTab('{t}')"); await pg.wait_for_timeout(80)
    await pg.evaluate("switchRole('manufacturer')"); await pg.wait_for_timeout(200)
    print("errors:",errs[:3]); await pg.screenshot(path=sys.argv[2] if len(sys.argv)>2 else "/tmp/claude-0/smoke.png"); await b.close()
asyncio.run(m(sys.argv[1]))
