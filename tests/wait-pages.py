"""Wait for the exact committed V2 assets on the existing GitHub Pages deployment."""
import os,time,hashlib,json
from urllib.request import urlopen,Request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='https://ptravnicek.github.io/kemet-ai-companion/v2/'
files=['index.html','core.js','art.js','app.js','style.css']
expected={p:hashlib.sha256((ROOT/'v2'/p).read_bytes()).hexdigest() for p in files}
last_error='not checked'
for attempt in range(45):
    try:
        for p in files:
            req=Request(BASE+p+'?verify='+os.getenv('GITHUB_SHA','local')+'-'+str(attempt),headers={'Cache-Control':'no-cache','User-Agent':'Kemet-V2-Deployment-Test'})
            with urlopen(req,timeout=20) as response:
                assert response.status==200
                assert hashlib.sha256(response.read()).hexdigest()==expected[p], p+' not updated yet'
        report={'url':BASE,'http':200,'all_five_asset_hashes_match':True,'commit':os.getenv('GITHUB_SHA'),'sha256':expected}
        (ROOT/'live-deployment.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report,indent=2),flush=True)
        break
    except Exception as e:
        last_error=str(e);print('Waiting for Pages:',last_error,flush=True);time.sleep(6)
else:raise SystemExit('Pages deployment not verified: '+last_error)
