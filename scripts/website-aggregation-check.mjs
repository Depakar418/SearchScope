import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const dir=await fs.mkdtemp(path.join(process.cwd(),'.sites-runtime','website-aggregation-'));
try{
 const files=['lib/dom-extraction.ts','lib/link-analysis.ts','lib/finding-guides.ts','lib/page-metrics.ts','lib/audit-result.ts','lib/website-findings.ts','lib/audit.ts','lib/website-scores.ts','app/score-gauge.tsx','app/website-overview.tsx'];
 for(const file of files){const raw=(await fs.readFile(file,'utf8')).replace(/(['"])(?:\.\.\/lib\/|\.\/)([\w-]+)\1/g,(_,q,n)=>`${q}./${n}.mjs${q}`);await fs.writeFile(path.join(dir,path.basename(file).replace(/\.tsx?$/,'.mjs')),ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
 const {analyze}=await import(path.join(dir,'audit.mjs'));
 const {websiteFindingGroups}=await import(path.join(dir,'website-findings.mjs'));
 const {websiteAuditSummary}=await import(path.join(dir,'audit-result.mjs'));
 const {WebsiteOverview}=await import(path.join(dir,'website-overview.mjs'));
 const markup='<main><h1>Example</h1><img src="/one.jpg"><img src="/two.jpg"><a href="/next">Next</a></main>';
 const page=(n,report,status='completed',audited='2026-10-01T00:00:00Z')=>({id:String(n),url:`https://example.com/p${n}`,status,audited,report,fetch:null});
 const make=n=>analyze(markup,`https://example.com/p${n}`,'','url');
 const one=make(1),two=make(2),three=make(3);
 const alt=one.checks.find(c=>c.id==='alt');assert.ok(alt);assert.equal(alt.severity,'warning');
 const group=websiteFindingGroups([page(1,one)]).find(g=>g.id==='alt');
 assert.equal(group.affectedPageCount,1);assert.equal(group.affectedElementCount,2,'two affected images, one finding group');
 const pages=[page(1,one),page(2,two),page(3,three),page(4,null,'failed'),page(5,null,'failed'),page(1,null,'failed','2026-09-01T00:00:00Z')];
 const summary=websiteAuditSummary(pages,8,8),groups=websiteFindingGroups(pages);
 const shared=groups.find(g=>g.id==='alt');assert.equal(shared.affectedPageCount,3);assert.equal(shared.affectedElementCount,6);
 assert.equal(summary.findings.warnings,groups.filter(g=>g.severity==='warning').length);
 assert.equal(summary.findings.errors,groups.filter(g=>g.severity==='error').length);
 assert.equal(summary.findings.needsAttention,groups.filter(g=>['warning','error','opportunity'].includes(g.severity)).length);
 assert.equal(summary.technical.evaluations,one.checks.length+two.checks.length+three.checks.length);
 assert.equal(summary.completed,3);assert.equal(summary.failed,2);assert.equal(summary.remaining,3);
 assert.equal(summary.findings.groups.find(g=>g.id==='alt').affectedElementCount,6);
 const html=renderToStaticMarkup(React.createElement(WebsiteOverview,{pages,discovered:8,selected:8}));
 assert.match(html,/>Website finding groups</);assert.match(html,/>3 affected pages</);assert.match(html,/>6 identified elements</);
 assert.match(html,new RegExp(`${summary.technical.evaluations} check evaluations`));
 assert.doesNotMatch(html,/All checks|Source checks that passed/);
 const latest=[page(1,one),page(1,null,'failed','2026-10-02T00:00:00Z')];assert.equal(websiteAuditSummary(latest,1,1).completed,0);assert.equal(websiteAuditSummary(latest,1,1).failed,1);assert.equal(websiteFindingGroups(latest).length,0);
 const many=Array.from({length:88},(_,i)=>page(i+1,make(i+1)));
 const total=websiteAuditSummary(many,100,100);assert.equal(total.technical.evaluations,88*one.checks.length);assert.equal(total.findings.warnings,websiteFindingGroups(many).filter(g=>g.severity==='warning').length);assert.ok(total.findings.warnings<total.technical.evaluations);
 console.log('PASS: unique finding groups, affected pages/elements, mixed coverage, latest-attempt failures, 88-page evaluation distinction and rendered overview reconciliation.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
