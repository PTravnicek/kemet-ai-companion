import {boardSVG as base} from '../v2/art.js';
export {icon,esc,battleCard,tileArt} from '../v2/art.js';
// Original board drawing (never an uploaded image). Place artwork and labels on V3's shared coordinate grid.
export const boardSVG=base.replace('west-bank tabletop mirror','original-edition two-player west bank')
 .replace('translate(79 626)','translate(62 571)')
 .replace('Area boundaries, not a rules-engine adjacency graph.','Stylized territory outlines; route highlighting uses the separate audited graph.')
 .replace('<text x="92" y="382">WESTERN SANDS</text>','<text x="143" y="435">YOUR CITY APPROACH</text>')
 .replace('<text x="311" y="669">OBELISK</text>','<text x="245" y="620">OBELISK DESERT</text><text x="237" y="721">AI CITY APPROACH</text><text x="385" y="614" font-size="10">RIVER APPROACH</text>')
 .replace('<text x="80" y="698">SOUTH TEMPLE</text>','<text x="71" y="647" font-size="10">SOUTHERN TEMPLE · +2</text>')
 .replace('RIVERSIDE TEMPLE</text>','RIVERSIDE TEMPLE · +3</text>');
