import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const dir=await fs.mkdtemp(path.join(process.cwd(),'.sites-runtime','project-view-'));
try{
 const files=[...(await fs.readdir('lib')).filter(f=>f.endsWith('.ts')).map(f=>'lib/'+f),...(await fs.readdir('app')).filter(f=>f.endsWith('.tsx')&&!['legacy-workspace.tsx','layout.tsx'].includes(f)).map(f=>'app/'+f)];
 const names=new Map(files.map((f,i)=>[path.resolve(f),`module-${i}.mjs`]));
 for(const f of files){const raw=(await fs.readFile(f,'utf8')).replace(/(['"])(\.[^'"]+)\1/g,(m,q,p)=>{const target=path.resolve(path.dirname(f),p);const entry=names.get(target+'.ts')||names.get(target+'.tsx');return entry?`${q}./${entry}${q}`:m;});await fs.writeFile(path.join(dir,names.get(path.resolve(f))),ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
 const load=f=>import(path.join(dir,names.get(path.resolve(f))));
 const {default:Projects}=await load('app/page.tsx'),{default:Workspace}=await load('app/project-workspace.tsx'),{DestinationFindings}=await load('app/destination-findings.tsx'),{analyze}=await load('lib/audit.ts');
 const hub=renderToStaticMarkup(React.createElement(Projects));assert.match(hub,/New project/);assert.match(hub,/Import existing audits/);assert.match(hub,/Search projects/);
 const p={id:'project-test',name:'Example website',site:'https://example.com',type:'website',description:'Example',status:'active',created:'2026-01-01',updated:'2026-01-01'};
 const workspace=renderToStaticMarkup(React.createElement(Workspace,{id:p.id,initialProject:p}));for(const label of ['Overview','Audits','Pages','Issues','Content Analyzer','Opportunities','Reports','History','Project Settings'])assert.match(workspace,new RegExp(label));assert.match(workspace,/aria-current="page"/);assert.match(workspace,/value="https:\/\/example.com"/);assert.doesNotMatch(workspace,/Depakar/);
 const report=analyze('<main><h1>Example</h1><a href="/missing">Missing page</a></main>','https://example.com','','url');report.linkResults=[{url:'https://example.com/missing',internal:true,status:404,state:'broken',finalURL:'https://example.com/missing',redirects:[],error:null,checkedAt:'2026-01-01',method:'HEAD'}];
 const destination=renderToStaticMarkup(React.createElement(DestinationFindings,{pages:[{id:'page',url:report.label,report,status:'completed',error:null,audited:'2026-01-01',type:'Home',typeSource:'URL estimate'}]}));assert.match(destination,/<details/);assert.match(destination,/<summary/);assert.match(destination,/HTTP 404/);assert.match(destination,/How do I resolve it/);assert.match(destination,/nth-of-type/);assert.match(destination,/&lt;a href=/);assert.doesNotMatch(destination,/<details[^>]* open/);
 console.log('PASS: server-rendered project hub, context/sidebar navigation, project URL input and collapsed destination-evidence/fix accordions. Browser interactions, sticky positioning and mobile layout are not visually validated.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
