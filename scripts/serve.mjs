/** Small dependency-free static server for a preview host. No game backend. */
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be a valid TCP port.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const requested=decodeURIComponent(new URL(req.url,'http://preview.invalid').pathname);
  if(requested==='/'){res.writeHead(302,{'Location':'/v3/'});res.end();return;}
  let target=path.resolve(root,'.'+requested);
  if(target!==root&&!target.startsWith(root+path.sep))throw Error('Outside root');
  if((await stat(target)).isDirectory())target=path.join(target,'index.html');
  target=await realpath(target);
  if(!target.startsWith(root+path.sep))throw Error('Outside root');
  const data=await stat(target);if(!data.isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':data.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'0.0.0.0',()=>console.log(`Kemet static preview listening on port ${port}; entry /v3/`));
