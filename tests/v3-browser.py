"""V3 touch/click tests. Run locally or BASE_URL=https://.../v3/ after deployment."""
import os, json, threading, functools
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DOM=os.getenv('DOM_TEST')=='1'
BASE='in-memory DOM (no network)' if DOM else os.getenv('BASE_URL','http://127.0.0.1:8877/v3/')
HTML=(ROOT/'v3/standalone.html').read_text() if DOM else ''
def open_page(page,restore=False):
    if DOM:
        seed=page.evaluate("window.localStorage.getItem('kemet.tabletop.v3')") if restore else None
        init="<script>Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const map=new Map();"
        if seed:init+="map.set('kemet.tabletop.v3',"+json.dumps(seed)+");"
        init+="return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};})()});</script>"
        page.set_content(HTML.replace('<head>','<head>'+init),wait_until='load')
        return type('Response',(),{'status':200})()
    return page.reload(wait_until='networkidle') if restore else page.goto(BASE,wait_until='networkidle')
server=None
if not os.getenv('BASE_URL') and not DOM:
    server=ThreadingHTTPServer(('127.0.0.1',8877),functools.partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
report=[]
with sync_playwright() as pw:
    for name in os.getenv('BROWSERS','chromium').split(','):
        kwargs={}
        if name=='chromium' and os.getenv('CHROMIUM_PATH'):
            kwargs['executable_path']=os.environ['CHROMIUM_PATH']
            kwargs['args']=['--no-sandbox']
        browser=getattr(pw,name).launch(**kwargs)
        for width,height in [(390,844),(1280,900)]:
            ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<600,is_mobile=width<600)
            page=ctx.new_page(); errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_default_timeout(12000)
            response=open_page(page)
            assert response.status==200
            page.wait_for_function("window.kemet?.version === '3.0.0-beta.1'")
            assert page.locator('#boot').is_hidden()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
            page.screenshot(path=str(ROOT/f'v3-{name}-{width}-table.png'),full_page=True)
            # Movement split -> persistent invalid-choice explanation -> path receipt -> cancel.
            page.locator('[data-testid="zone-h-r"]').click()
            page.get_by_role('button',name='Show reachable destinations',exact=True).click()
            page.locator('[data-testid="zone-a-r"]').click()
            assert 'City wall' in page.locator('#movebar').inner_text()
            assert page.get_by_role('button',name='Confirm move',exact=True).is_disabled()
            page.locator('[data-testid="zone-north"]').click()
            assert page.locator('.path-walk').count()>=1
            assert page.evaluate('kemet.getState().zones.north.human')==0
            page.screenshot(path=str(ROOT/f'v3-{name}-{width}-move.png'),full_page=True)
            page.get_by_role('button',name='Cancel move',exact=True).click()
            assert page.evaluate('kemet.getState().players.human.prayer')==7
            # Real move with split and no free action repetition.
            page.locator('[data-testid="zone-h-r"]').click()
            page.get_by_role('button',name='Show reachable destinations',exact=True).click()
            page.locator('[data-testid="zone-north"]').click()
            page.get_by_role('button',name='Confirm move',exact=True).click()
            assert page.evaluate('kemet.getState().zones.north.human')==3
            assert page.evaluate("kemet.getState().players.human.slots.includes('move1')")
            assert page.evaluate('kemet.getState().active')=='ai'
            # AI suggestion is preview only; then confirmation uses same paid engine.
            page.locator('[data-action="ai-turn"]').click()
            before=page.evaluate('kemet.getState().rev')
            assert page.evaluate('kemet.getState().players.ai.slots.length')==0
            page.get_by_role('button',name='Confirm & pay',exact=True).click()
            assert page.evaluate('kemet.getState().rev')==before+1
            assert page.evaluate('kemet.getState().players.ai.slots.length')==1
            assert page.evaluate('kemet.getState().active')=='human'
            # Raise 1->3, preview no changes, actual charge five once.
            page.locator('[data-action="pyramid"][data-who="human"][data-color="red"]').click()
            page.locator('[data-action="raise-preview"][data-level="3"]').click()
            assert page.evaluate('kemet.getState().players.human.pyramids.red')==1
            assert '7 → 2' in page.locator('#sheet').inner_text()
            page.screenshot(path=str(ROOT/f'v3-{name}-{width}-payment.png'),full_page=True)
            page.get_by_role('button',name='Confirm & pay',exact=True).click()
            assert page.evaluate('kemet.getState().players.human.pyramids.red')==3
            assert page.evaluate('kemet.getState().players.human.prayer')==2
            open_page(page,True)
            assert page.evaluate('kemet.getState().players.human.pyramids.red')==3
            # Isolated practice: two real, independent hands are not consumed.
            page.get_by_role('button',name='Game menu').click()
            page.get_by_role('button',name='Practice battle',exact=True).click()
            page.get_by_role('button',name='Practice · no board or hand changes',exact=True).click()
            locked=page.evaluate('[kemet.getState().battle.aiPlay,kemet.getState().battle.aiDiscard]')
            for id in ['c41','c32']:
                page.locator('[data-action="select-card"][data-id="'+id+'"]').click()
            assert page.evaluate('[kemet.getState().battle.aiPlay,kemet.getState().battle.aiDiscard]')==locked
            open_page(page,True)
            assert page.evaluate('[kemet.getState().battle.aiPlay,kemet.getState().battle.aiDiscard]')==locked
            page.get_by_role('button',name='Reveal & resolve',exact=True).click()
            page.get_by_role('button',name='Finish battle',exact=True).click()
            assert page.evaluate('kemet.getState().players.human.hand.length')==6
            # Mirror label and constrained return.
            page.locator('[data-action="coverage"]').click()
            page.get_by_role('button',name='Enter Mirror / setup mode',exact=True).click()
            assert 'COSTS NOT APPLIED' in page.locator('#turn-label').inner_text()
            page.locator('[data-testid="zone-north"]').click()
            page.get_by_role('button',name='Increase Units',exact=True).click()
            assert page.evaluate('kemet.getState().zones.north.human')==3 # AI is active: adds AI, not human
            page.get_by_role('button',name='Close panel').click()
            page.locator('[data-action="coverage"]').click()
            page.get_by_role('button',name='Return to Rules mode',exact=True).click()
            assert page.evaluate('kemet.getState().mode')=='mirror' # opposed armies need reconciliation
            assert 'resolved battle' in page.locator('#sheet').inner_text()
            assert not errors,errors
            result={'browser':name,'viewport':[width,height],'url':BASE,'transport':'DOM+storage stub' if DOM else 'HTTP','http':None if DOM else 200,'version':'3.0.0-beta.1','errors':errors,'flows':['movement preview','illegal destination','cancel','paid move','AI preview+pay','pyramid 1→3 payment','reload','isolated practice','independent hidden commitment','Mirror warning and return validation']}
            report.append(result);print(json.dumps(result),flush=True);ctx.close()
        # localStorage failures must not disable controls.
        ctx=browser.new_context(viewport={'width':390,'height':844})
        ctx.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError')}")
        page=ctx.new_page();open_page(page)
        if DOM:page.evaluate("(()=>{window.localStorage.setItem=()=>{throw Error('blocked')};})()")
        page.locator('[data-action="pyramid"][data-who="human"][data-color="red"]').click()
        page.locator('[data-action="raise-preview"][data-level="2"]').click()
        page.get_by_role('button',name='Confirm & pay',exact=True).click()
        assert page.evaluate('kemet.getState().players.human.prayer')==5
        report.append({'browser':name,'storage_blocked':'payment controls still work'})
        browser.close()
(ROOT / ('v3-dom-results.json' if DOM else 'v3-browser-results.json')).write_text(json.dumps(report,indent=2))
if server:server.shutdown()
