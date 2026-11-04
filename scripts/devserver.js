// Test-only: serves dist/ and maps CDN-style paths (pkg@ver/...) to node_modules.
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.gz':'application/gzip','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);let f;
  if(u.startsWith('/lib/')){u=u.slice(5).replace(/^(@[^/]+\/[^@/]+|[^@/]+)@[^/]+/,'$1');f=path.join(ROOT,'node_modules',u)}else f=path.join(ROOT,u);
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('nf '+f)}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Access-Control-Allow-Origin':'*'});r.end(d)})}).listen(+process.argv[2]||8765);
