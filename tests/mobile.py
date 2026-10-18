"""Click-driven browser tests, against a local HTTP server or the live HTTPS app."""
import os, json, threading, functools
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('BASE_URL','http://127.0.0.1:8765/v2/')
server=None
if 'BASE_URL' not in os.environ:
    server=ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
REPORT=[]
with sync_playwright() as pw:
    for name in os.environ.get('BROWSERS','chromium,webkit').split(','):
        browser=getattr(pw,name).launch()
        for width,height,mobile in [(390,844,True),(1280,900,False)]:
            context=browser.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
            page=context.new_page(); errors=[]
            page.set_default_timeout(15000)
            page.on('pageerror',lambda e:errors.append(str(e)))
            response=page.goto(BASE,wait_until='networkidle',timeout=60000)
            assert response.status==200, f'HTTP {response.status}'
            page.wait_for_function("window.kemet?.version === '2.0.0'")
            assert page.locator('#boot').is_hidden()
            page.screenshot(path=str(ROOT/f'preview-{name}-{width}.png'),full_page=True)
            page.locator('[data-testid="zone-west"]').click()
            page.get_by_role('button',name='Increase Units',exact=True).click()
            assert page.evaluate('kemet.getState().zones.west.human')==1
            page.get_by_role('button',name='Close panel').click()
            page.reload(wait_until='networkidle')
            assert page.evaluate('kemet.getState().zones.west.human')==1
            page.locator('.dock [data-action="player"]').click()
            page.get_by_role('button',name='Increase Prayer',exact=True).click()
            assert page.evaluate('kemet.getState().players.human.prayer')==6
            page.get_by_role('button',name='Close panel').click()
            page.locator('.dock [data-action="market"]').click()
            page.locator('#sheet .power-tile[data-id="red-0"]').click()
            page.locator('[data-action="assign-tile"][data-who="human"]').click()
            assert page.evaluate("kemet.getState().tiles['red-0']")=='human'
            page.get_by_role('button',name='Close panel').click()
            page.locator('[data-testid="zone-west"]').click()
            page.locator('[data-action="move"]').click()
            page.locator('[data-testid="zone-north"]').click()
            assert page.evaluate('kemet.getState().zones.north.human')==1
            page.get_by_role('button',name='Close panel').click()
            for i in range(4):
                page.locator('.dock [data-action="start-battle"]').click()
                page.locator('[data-action="quick-battle"]').click()
                locked=page.evaluate('[kemet.getState().battle.aiPlay, kemet.getState().battle.aiDiscard]')
                assert page.get_by_role('heading',name='AI has committed').is_visible()
                page.locator('[data-action="select-card"]:not([disabled])').nth(0).click()
                page.locator('[data-action="select-card"]:not([disabled])').nth(1).click()
                assert page.evaluate('[kemet.getState().battle.aiPlay, kemet.getState().battle.aiDiscard]')==locked
                if i==0:
                    page.reload(wait_until='networkidle')
                    assert page.evaluate('[kemet.getState().battle.aiPlay, kemet.getState().battle.aiDiscard]')==locked
                page.locator('[data-action="reveal"]').click()
                assert page.locator('[data-action="finish"]').is_visible()
                assert page.evaluate('kemet.getState().battle.phase')=='result'
                expected=6 if i==2 else (4 if i in [0,3] else 2)
                assert page.evaluate('kemet.getState().players.human.hand.length')==expected
                assert page.evaluate('kemet.getState().players.ai.hand.length')==expected
                if i==0:page.screenshot(path=str(ROOT/f'battle-{name}-{width}.png'),full_page=True)
                page.locator('[data-action="finish"]').click()
                assert page.locator('#sheet').is_hidden()
            assert not errors,errors
            REPORT.append({'url':BASE,'browser':name,'viewport':[width,height],'http':response.status,'version':'2.0.0','console_errors':errors,'flows':'board, resource, tile assignment, move, reload, 4 battles, independent hand recovery'})
            print(json.dumps(REPORT[-1]),flush=True)
            context.close()
        context=browser.new_context(viewport={'width':390,'height':844})
        context.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError')};")
        page=context.new_page();page.goto(BASE,wait_until='networkidle');page.locator('[data-testid="zone-west"]').click();page.get_by_role('button',name='Increase Units',exact=True).click()
        assert page.evaluate('kemet.getState().zones.west.human')==1
        REPORT.append({'url':BASE,'browser':name,'storage_blocked':'controls remain usable'})
        browser.close()
(ROOT/'browser-test-results.json').write_text(json.dumps(REPORT,indent=2))
print(json.dumps(REPORT,indent=2),flush=True)
if server:server.shutdown()
