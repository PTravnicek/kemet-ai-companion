// Original vector component graphics. No scans or external image downloads.
export const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function icon(name){const paths={
 sword:'M5 21 18 8l2-6-6 2L2 17m2-3 6 6M1 22l3-3',
 shield:'M12 2 3 5v7c0 5 9 10 9 10s9-5 9-10V5Z',
 drop:'M12 2C10 7 4 11 4 16a8 8 0 0 0 16 0c0-5-6-9-8-14Z',
 eye:'M1 12Q12 1 23 12Q12 23 1 12Zm11-5a5 5 0 1 0 0 10a5 5 0 0 0 0-10',
 ankh:'M12 10c-9 0-7-9 0-9s9 9 0 9m0 0v13M4 14h16',
 temple:'M2 9 12 2l10 7H2Zm2 1v10m5-10v10m6-10v10m5-10v10M1 22h22',
 pyramid:'M12 2 1 22h22L12 2v20m0-20L6 18l6 4',
 feather:'M4 22 17 3m-10 9Q5 1 21 1c2 13-8 18-14 11m0 0 6 2',
 scarab:'M7 8c-5-5-6 4-1 5m11-5c5-5 6 4 1 5M5 17l-4 4m18-4 4 4M8 6a4 4 0 1 1 8 0m-4 0c-10 0-10 16 0 16s10-16 0-16Zm0 0v16',
 sun:'M12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14m0-4v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2',
 move:'M2 12h20m-6-6 6 6-6 6',
 chariot:'M3 18a3 3 0 1 0 6 0a3 3 0 1 0-6 0m11 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M1 6l2 9h16l3-10M7 14V2m0 0h8l-4 3H7',
 horse:'M5 22V12l7-5-1-5 8 4 3 7-4 2-4-4-4 11Z',
 snake:'M4 21c20 2 20-8 6-8S1 3 18 4l2-3m-2 3 3 4',
 hand:'M8 21 3 12q0-3 3-1l2 2V4q1-4 3 0v7-9q2-3 3 0v9-8q2-2 3 1v8-6q3-2 3 2v9l-4 6Z',
 moon:'M19 2a10 10 0 1 0 3 16A11 11 0 0 1 19 2Z',
 close:'M5 5l14 14M19 5 5 19',
 undo:'M9 4 3 10l6 6M3 10h10a8 8 0 0 1 8 8',
 menu:'M4 6h16M4 12h16M4 18h16'
};return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.scarab}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
export function stats(c){return `<div class="card-stats"><span class="str">${icon('sword')}<b>${c.s}</b></span><span class="dmg">${icon('drop')}<b>${c.d}</b></span><span class="def">${icon('shield')}<b>${c.p}</b></span></div>`;}
export function battleCard(c,options={}){const {action='inspect-card',selected='',disabled=false,small=false}=options;return `<button class="battle-card ${small?'compact':''} ${selected}" data-action="${action}" data-id="${c.id}" ${disabled?'disabled':''} aria-label="${c.name}: strength ${c.s}, damage ${c.d}, protection ${c.p}"><span class="card-kicker">KEMET · BATTLE</span><span class="illustration">${icon(c.art==='swords'?'sword':c.art)}<i></i></span><strong>${esc(c.name)}</strong>${stats(c)}<span class="selection-label">${selected==='played'?'PLAY':selected==='discarded'?'DISCARD':' '}</span></button>`;}
export function tileArt(t,owner){const i=/Scarab|God/.test(t.name)?'scarab':/Snake/.test(t.name)?'snake':/Victory|Prescience|Vision/.test(t.name)?'eye':/Priest|Prayer|Scribe/.test(t.name)?'ankh':/Defense|Shield|Legion|Elephant/.test(t.name)?'shield':/Gate|Teleport|Speed/.test(t.name)?'pyramid':/Mummy|Reinforc/.test(t.name)?'hand':'sword';return `<button class="power-tile ${t.color} ${owner?'owned-'+owner:''}" data-action="tile" data-id="${t.id}" aria-label="${esc(t.name)}, ${t.color}, level ${t.level}${owner?', owned by '+owner:''}"><span class="tile-level">${'Ⅰ'.repeat(t.level)}</span><span class="tile-art">${icon(i)}</span><strong>${esc(t.name)}</strong><small>${owner==='human'?'YOUR MAT':owner==='ai'?'AI MAT':'LEVEL '+t.level}</small></button>`;}
export const boardSVG=`<svg class="map-art" viewBox="0 0 700 850" role="img" aria-label="Top-down Nile board, west-bank tabletop mirror">
<defs>
 <linearGradient id="sand" x2="1" y2="1"><stop stop-color="#ba8850"/><stop offset=".4" stop-color="#e1c590"/><stop offset="1" stop-color="#b28550"/></linearGradient>
 <linearGradient id="river" x2="1" y2="0"><stop stop-color="#3d666e"/><stop offset=".5" stop-color="#7c9b9b"/><stop offset="1" stop-color="#324e58"/></linearGradient>
 <pattern id="grain" width="55" height="36" patternUnits="userSpaceOnUse"><path d="M0 21q12-8 25 0t30 0M5 31q10-6 20-2" fill="none" stroke="#947443" stroke-opacity=".18" stroke-width="1.5"/></pattern>
 <pattern id="roofs" width="23" height="27" patternUnits="userSpaceOnUse"><path d="M2 2h17v19H2Z" fill="#c7ac7d" stroke="#66523a" stroke-width="2"/><path d="M4 4h13v5H4" fill="#ecd8ae"/><path d="M15 14h4v7h-4Z" fill="#77664b"/></pattern>
 <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0v10" stroke="#66553e" stroke-opacity=".2" stroke-width="3"/></pattern>
 <g id="temple"><path d="M-42 15h84v38h-84Z" fill="#8a7251" stroke="#4d4231" stroke-width="3"/><path d="M-37 12h74v34h-74Z" fill="#d6bb8e" stroke="#695237" stroke-width="2"/><path d="M-35 14v-34l70 0v34Z" fill="#b89a67" stroke="#584733" stroke-width="3"/><path d="M-40-20h80v-8h-80Z" fill="#e4c697" stroke="#584733" stroke-width="2"/><path d="M-25-18v30m16-30v30m17-30v30m17-30v30" stroke="#e4cfaa" stroke-width="9"/><path d="M-36 29h72m-72 6h72m-72 6h72" stroke="#827252" stroke-width="2"/></g>
 <g id="palm"><path d="M0 12 2-7" stroke="#625c37" stroke-width="4"/><path d="M1-7q-23-15-22 4Q-13-8 1-7q18-20 24 1Q13-13 1-7q-15-20 0-26Q-1-16 1-7q18-6 16 13Q10-5 1-7" fill="#737343" stroke="#4d5d37" stroke-width="1"/></g>
</defs>
<rect width="700" height="850" rx="12" fill="url(#sand)"/>
<rect x="10" y="10" width="680" height="830" rx="8" fill="url(#grain)" stroke="#f6dcb0" stroke-width="2"/>
<path d="M430-10C419 94 343 169 345 238S385 325 425 401 442 534 505 591 587 720 626 850h91V-10Z" fill="#bcad83"/>
<path d="M423-12C411 98 320 174 326 240S371 325 407 398 425 539 488 602 573 728 610 860" fill="none" stroke="#728562" stroke-width="74" opacity=".5"/>
<path d="M423-12C411 98 320 174 326 240S371 325 407 398 425 539 488 602 573 728 610 860" fill="none" stroke="#ecdbb3" stroke-width="43"/>
<path d="M423-12C411 98 320 174 326 240S371 325 407 398 425 539 488 602 573 728 610 860" fill="none" stroke="url(#river)" stroke-width="35"/>
<path d="M120-10q110 130 212 231M268-5q-28 140 64 226" fill="none" stroke="#ddcfa7" stroke-width="20"/>
<path d="M120-10q110 130 212 231M268-5q-28 140 64 226" fill="none" stroke="url(#river)" stroke-width="14"/>
<!-- Area boundaries, not a rules-engine adjacency graph. -->
<g fill="none" stroke="#fff0c4" stroke-width="2.7" opacity=".88"><path d="M18 322q135 38 286-58M20 565q146 18 179-50t172-47M179 314q-13 120 43 187M222 501q73 25 126 55t123 12M136 708q46-56 86-207M350 556q45 110 81 165"/></g>
<g opacity=".36" fill="none" stroke="#9c773f" stroke-width="2"><path d="M26 369q75-42 123-16m-123 59q66-30 113-6m93 17q49-18 75-3m-95 239q63-20 97-1M443 172q95-25 191 13m-120 84q60-19 135 4"/></g>
<!-- Walled districts: city at upper left and city along southern edge. -->
<path d="M40 145 150 134 225 183 241 269 181 320 46 332 24 245Z" fill="#715940" stroke="#e8d0a2" stroke-width="9"/>
<path d="M45 153 150 144 219 188 229 264 178 310 54 322 35 245Z" fill="url(#roofs)"/>
<path d="M41 236 139 233 151 149M139 233 224 261" fill="none" stroke="#f5dfb5" stroke-width="6"/>
<path d="M142 730 216 695 372 704 442 756 446 829 134 829Z" fill="#6b543b" stroke="#e9cf9a" stroke-width="10"/>
<path d="M144 739 218 705 367 714 432 760 436 824 143 824Z" fill="url(#roofs)"/>
<path d="M247 709v117m95-111 0 111" stroke="#edd3a6" stroke-width="6"/>
<g transform="translate(246 91) scale(1.1)"><use href="#temple"/></g>
<g transform="translate(331 392)"><use href="#temple"/></g>
<g transform="translate(79 626) rotate(13)"><use href="#temple"/></g>
<g transform="translate(528 140) scale(1.1)" opacity=".35"><use href="#temple"/></g>
<g transform="translate(570 452)" opacity=".35"><use href="#temple"/></g>
<path d="M264 550 254 596 276 599 270 548 267 540Z" fill="#4f483b" stroke="#dcc89c" stroke-width="2"/><path d="M267 543 265 593 275 596" fill="#9a8560"/>
<g opacity=".8"><use href="#palm" x="176" y="73"/><use href="#palm" x="195" y="94"/><use href="#palm" x="297" y="173"/><use href="#palm" x="294" y="443"/><use href="#palm" x="80" y="575"/><use href="#palm" x="408" y="659"/></g>
<path d="M455 20 681 20V827h-32q-34-133-113-222T466 395Q365 210 455 20" fill="url(#hatch)"/>
<g fill="#5b5748" font-family="Georgia,serif" text-anchor="middle"><text x="549" y="310" font-size="16" letter-spacing="4" transform="rotate(26 549 310)">EAST BANK</text><text x="554" y="334" font-size="10" transform="rotate(26 554 334)">NOT IN PLAY · 2 PLAYERS</text></g>
<g fill="#5a4225" font-family="Georgia,serif" text-anchor="middle" font-size="13" letter-spacing="1"><text x="239" y="37">THE NILE DELTA</text><text x="300" y="488">RIVERSIDE TEMPLE</text><text x="80" y="698">SOUTH TEMPLE</text><text x="92" y="382">WESTERN SANDS</text><text x="311" y="669">OBELISK</text></g>
<rect x="13" y="13" width="674" height="824" rx="8" fill="none" stroke="#5b462a" stroke-width="2"/>
</svg>`;
