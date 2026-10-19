"""CI gate: compare actual published bytes, never assume deployment success."""
import hashlib,json,os,time,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.getenv('PAGES_ROOT','https://ptravnicek.github.io/kemet-ai-companion/').rstrip('/')+'/'
FILES=[f'v3/{name}' for name in ('index.html','core.js','map.js','art.js','app.js','style.css')]+[f'v2/{name}' for name in ('core.js','art.js','style.css')]
expected={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in FILES}
last={}
for attempt in range(30):
    last={}
    for f in FILES:
        try:
            request=urllib.request.Request(BASE+f+'?verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
            with urllib.request.urlopen(request,timeout=15) as response:
                got=hashlib.sha256(response.read()).hexdigest()
                if got!=expected[f]:last[f]='content hash mismatch'
        except (OSError,urllib.error.URLError) as e:last[f]=str(e)
    if not last:
        report={'url':BASE+'v3/','http':200,'all_nine_files_match':True,'commit':os.getenv('GITHUB_SHA'), 'sha256':expected}
        (ROOT/'v3-live-deployment.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));break
    print('Not published yet:',json.dumps(last),flush=True);time.sleep(10)
else:raise SystemExit('Live V3 verification failed; do not announce it as published: '+json.dumps(last))
