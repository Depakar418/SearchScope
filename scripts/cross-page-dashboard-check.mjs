import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const dir=await fs.mkdtemp(path.join(process.cwd(),'.sites-runtime','cross-page-dashboard-'));
try{
 const files=[...(await fs.readdir('lib')).filter(f=>f.endsWith('.ts')).map(f=>'lib/'+f),...(await fs.readdir('app')).filter(f=>f.endsWith('.tsx')&&!['legacy-workspace.tsx','layout.tsx'].includes(f)).map(f=>'app/'+f)];
 const names=new Map(files.map((f,i)=>[path.resolve(f),`module-${i}.mjs`]));
 for(const file of files){const raw=(await fs.readFile(file,'utf8')).replace(/(['"])(\.[^'"]+)\1/g,(match,q,relative)=>{const target=path.resolve(path.dirname(file),relative);const entry=names.get(target+'.ts')||names.get(target+'.tsx');return entry?`${q}./${entry}${q}`:match;});await fs.writeFile(path.join(dir,names.get(path.resolve(file))),ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
 const load=file=>import(path.join(dir,names.get(path.resolve(file))));
 const {AUDIT_LIMITS,permittedPageLimit}=await load('lib/audit-limits.ts');assert.equal(AUDIT_LIMITS.pageLimit,200);assert.ok(permittedPageLimit(200));assert.ok(!permittedPageLimit(201));
 const {analyze}=await load('lib/audit.ts'),{comparePages}=await load('lib/cross-page.ts'),{websiteAuditSummary}=await load('lib/audit-result.ts');
 const {AuditDashboard}=await load('app/audit-dashboard.tsx'),{CrossPageAnalysis}=await load('app/cross-page-analysis.tsx');
 const common='Training for every organization with practical examples and workplace learning. '.repeat(12);
 const unique=n=>Array.from({length:100},(_,j)=>`topic${n}word${j}`).join(' ');
 const make=n=>analyze(`<head><title>Page ${n}</title><meta name="description" content="Unique description ${n}"></head><main><h1>Unique heading ${n}</h1><p>${common}</p><p>${unique(n)}</p></main>`,`https://example.com/p${n}`);
 const reports=Array.from({length:200},(_,i)=>make(i));
 const rows=reports.map((report,i)=>({id:`p${i}`,url:`https://example.com/p${i}`,status:'completed',audited:'2026-10-02T10:00:00Z',report}));
 const comparison=comparePages(rows);assert.equal(comparison.compared,200);assert.equal(comparison.similarityCompared,200);assert.equal(comparison.groups.length,0,'shared template paragraph must not create similarity groups');assert.equal(comparison.candidatePairs,0,'unrelated retained content should not trigger detailed comparisons');
 reports[1]=analyze(`<head><title>Page 1</title><meta name="description" content="Unique description 1"></head><main><h1>Unique heading 1</h1><p>${common}</p><p>${unique(0)}</p></main>`,'https://example.com/p1');rows[1].report=reports[1];
 const matched=comparePages(rows);assert.equal(matched.groups.filter(g=>g.kind==='Similar content').length,1);const similar=matched.groups.find(g=>g.kind==='Similar content');assert.deepEqual(similar.urls,['https://example.com/p0','https://example.com/p1']);assert.equal(similar.confidence,'heuristic');assert.ok(similar.evidence.length);assert.equal(similar.analysisVersion,matched.analysisVersion);assert.equal(similar.pageIds.length,2);
 const selected=rows.slice(0,127),run={id:'r1',site:'https://example.com',created:'2026-10-02T10:00:00Z',status:'complete',inventory:{site:'https://example.com',pages:Array.from({length:164},(_,i)=>({url:`https://example.com/p${i}`}))},selected};
 const summary=websiteAuditSummary(selected,164,127);assert.equal(summary.completed,127);assert.equal(summary.discovered-summary.selected,37);
 const overview=renderToStaticMarkup(React.createElement(AuditDashboard,{run,pages:selected,onNavigate:()=>{}}));assert.match(overview,/SEO checklist/);assert.match(overview,/AEO checklist/);assert.match(overview,/GEO checklist/);assert.match(overview,/37 outside selection/);assert.match(overview,/Cross-page Analysis/);assert.doesNotMatch(overview,/class="page-table"|Affected elements &amp; source context/);
 const cross=renderToStaticMarkup(React.createElement(CrossPageAnalysis,{run,pages:selected,onOpen:()=>{}}));assert.match(cross,/Cross-page Analysis/);assert.match(cross,/127/);assert.match(cross,/Comparison groups/);assert.match(cross,/Duplicate titles/);assert.match(cross,/Similar content/);
 const route=await fs.readFile('app/projects/[id]/cross-page-analysis/page.tsx','utf8');assert.match(route,/requireChatGPTUser/);assert.match(route,/ownedProject/);
 console.log('PASS: 200-page limit and comparison, template exclusion, traceable similar pair, 127-of-164 dashboard coverage, separate authenticated cross-page route and compact audit overview.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
