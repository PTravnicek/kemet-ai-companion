"""Dependency-free static build for this small, fixed module graph.
Does not fetch anything, change Chrome policy, or require a dev server.
The source remains ESM; the generated single-page artifact runs identical functions
in module-local closures and is used for offline DOM/browser tests.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]

def module(path, replacements=(), extra=()):
    text=(ROOT/path).read_text()
    names=re.findall(r'export\s+(?:const|let|function|class)\s+(\w+)',text)
    for block in re.findall(r'export const \{([^}]+)\}',text):
        names.extend(x.strip() for x in block.split(','))
    for old,new in replacements:
        assert old in text,(path,old)
        text=text.replace(old,new)
    text=re.sub(r'export\s+(?=const|let|function|class)','',text)
    names=list(dict.fromkeys([*names,*extra]))
    return '(()=>{\n'+text+'\nreturn {'+','.join(names)+'};\n})()'
base=module('v2/core.js')
art=module('v2/art.js')
mapcode=module('v3/map.js')
core=module('v3/core.js',[
 ("import * as B from '../v2/core.js';","const B=__v2core;"),
 ("import {ZONES,ADJ,zone,other} from './map.js';","const {ZONES,ADJ,zone,other}=__map;"),
 ("export {ZONES,ADJ,zone,other};","")],['ZONES','ADJ','zone','other'])
art3=module('v3/art.js',[
 ("import {boardSVG as base} from '../v2/art.js';","const {boardSVG:base,icon,esc,battleCard,tileArt}=__v2art;"),
 ("export {icon,esc,battleCard,tileArt} from '../v2/art.js';","")],['icon','esc','battleCard','tileArt'])
app=(ROOT/'v3/app.js').read_text().replace("import * as C from './core.js?v=3.0.0-beta.1';","const C=__core;").replace("import {icon,esc,battleCard,tileArt,boardSVG} from './art.js?v=3.0.0-beta.1';","const {icon,esc,battleCard,tileArt,boardSVG}=__art;")
script=f'const __v2core={base};\nconst __v2art={art};\nconst __map={mapcode};\nconst __core={core};\nconst __art={art3};\n(()=>{{{app}\n}})();'
css=(ROOT/'v2/style.css').read_text()+re.sub(r'@import[^;]+;','',(ROOT/'v3/style.css').read_text())
html=(ROOT/'v3/index.html').read_text().replace('<link rel="stylesheet" href="style.css?v=3.0.0-beta.1">','<style>'+css+'</style>').replace('<script type="module" src="app.js?v=3.0.0-beta.1"></script>','<script>(()=>{'+script+'})();</script>')
(ROOT/'v3/standalone.html').write_text(html)
(ROOT/'v3/bundle-test.js').write_text(script)
print('Built standalone browser artifact:',len(html.encode()),'bytes')
