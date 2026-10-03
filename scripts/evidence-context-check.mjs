import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const dir=await fs.mkdtemp(path.join(process.cwd(),'.sites-runtime','evidence-context-'));
try{
 const files=['lib/dom-extraction.ts','lib/link-analysis.ts','lib/finding-guides.ts','lib/page-metrics.ts','lib/audit-result.ts','lib/website-findings.ts','lib/audit.ts','app/heading-issue-cue.tsx','app/source-evidence.tsx'];
 for(const file of files){const raw=(await fs.readFile(file,'utf8')).replace(/(['"])(?:\.\.\/lib\/|\.\/)([\w-]+)\1/g,(_,q,n)=>`${q}./${n}.mjs${q}`);await fs.writeFile(path.join(dir,path.basename(file).replace(/\.tsx?$/,'.mjs')),ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
 const {analyze}=await import(path.join(dir,'audit.mjs'));
 const {SourceEvidence}=await import(path.join(dir,'source-evidence.mjs'));
 const report=analyze('<html><head><title>Example</title><meta name="description" content=""><link rel="canonical" href="javascript:void(0)"><script type="application/ld+json">{"@type":"Organization",}</script></head><body><header><nav aria-label="Account menu"><a href="javascript:void(0)">Account</a></nav></header><main><section id="courses" aria-label="Courses"><h1>Training</h1><h3>Courses</h3><p>Explore the available training courses.</p><a href="/unnamed"><svg></svg></a><img src="/course.jpg"><img src="/another.jpg" alt="Another course"></section></main></body></html>','https://example.com/','','url');
 const render=id=>{const check=report.checks.find(c=>c.id===id);assert.ok(check,`missing ${id}`);assert.ok(check.evidenceItems.length,`missing ${id} evidence`);return renderToStaticMarkup(React.createElement(SourceEvidence,{items:check.evidenceItems,report,findingId:id}));};
 const unnamed=render('anchor-text');for(const part of ['Affected element · Link','No visible text','Destination','/unnamed','Main content → Courses','H3: Courses','Actual HTML snippet','Technical details','View in page at captured section'])assert.ok(unnamed.includes(part),`missing ${part}`);assert.doesNotMatch(unnamed,/<details class="evidence-technical" open/);assert.ok(unnamed.indexOf('No visible text')<unnamed.indexOf('CSS selector'));
 const account=render('link-href');assert.match(account,/Account menu/);assert.match(account,/javascript:void\(0\)/);assert.match(account,/button may fit better/);
 const image=render('alt');assert.match(image,/Affected element · Image/);assert.match(image,/Missing alt attribute/);assert.match(image,/course.jpg/);assert.match(image,/element-image-preview/);
 const dimensions=render('image-dimensions');assert.match(dimensions,/Declared dimensions/);assert.match(dimensions,/Not detected in HTML/);
 const heading=render('heading-order');assert.match(heading,/H3: Courses/);assert.match(heading,/Heading structure to review/);
 const description=render('description');assert.match(description,/Meta tag/);assert.match(description,/Current value/);
 const canonical=render('canonical-valid');assert.match(canonical,/Canonical \/ link tag/);assert.match(canonical,/javascript:void\(0\)/);
 const schema=render('schema');assert.match(schema,/Structured data format/);assert.match(schema,/Not detected in captured JSON-LD/);
 for(const check of report.checks)for(const item of check.evidenceItems||[]){if(item.kind==='element')assert.ok(item.snippet,`${check.id} element snippet empty`);}
 console.log('PASS: eight finding types have readable identity, context, source evidence and collapsed selectors without synthetic screenshots.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
