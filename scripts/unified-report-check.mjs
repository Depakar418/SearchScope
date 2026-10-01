import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const dir=await fs.mkdtemp(path.join(process.cwd(),'.sites-runtime','unified-report-'));
try{
  const files=['lib/finding-guides.ts','lib/page-metrics.ts','lib/report-tabs.ts','lib/report-export.ts','lib/audit.ts','lib/releases.ts','app/page-detail.tsx','app/report-panels.tsx','app/score-gauge.tsx','app/audit-report.tsx'];
  for(const file of files){
    const raw=(await fs.readFile(file,'utf8')).replace(/(['"])(?:\.\.\/lib\/|\.\/)([\w-]+)\1/g,(_,quote,name)=>`${quote}./${name}.mjs${quote}`);
    await fs.writeFile(path.join(dir,path.basename(file).replace(/\.tsx?$/,'.mjs')),ts.transpileModule(raw,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
  }
  const {analyze,SAMPLE}=await import(path.join(dir,'audit.mjs'));
  const {default:AuditReport,REPORT_MENU}=await import(path.join(dir,'audit-report.mjs'));
  const {PageDetail,CategoryExplanation}=await import(path.join(dir,'page-detail.mjs'));
  const report=analyze(SAMPLE,'https://example.com/');
  assert.deepEqual(REPORT_MENU,['All issues','Fix first','SEO','AEO','GEO','Page details']);
  const html=renderToStaticMarkup(React.createElement(AuditReport,{report,onBack:()=>{}}));
  assert.match(html,/aria-selected="true"[^>]*>Fix first/);
  assert.match(html,/Back to website pages/);
  assert.equal((html.match(/role="tab"/g)||[]).length,6);
  assert.equal((html.match(/Open Fix first report in new tab/g)||[]).length,1);
  assert.doesNotMatch(html,/class="action-plan"/);
  assert.doesNotMatch(html,/class="finding-workspace"/); // findings begin collapsed
  const details=renderToStaticMarkup(React.createElement(PageDetail,{report}));
  assert.equal((details.match(/<details\b/g)||[]).length,4);
  assert.equal((details.match(/<summary>/g)||[]).length,4);
  assert.doesNotMatch(details,/<details[^>]*\bopen\b/);
  const allCategory=renderToStaticMarkup(React.createElement(CategoryExplanation,{report,category:'SEO',showAction:false}));
  assert.doesNotMatch(allCategory,/new tab/);
  const source=await fs.readFile('app/page.tsx','utf8');
  assert.match(source,/function openPageReport\(page:Report\)[^\n]+setSection\('Audit workspace'\)/);
  assert.match(source,/<div hidden=\{!!report\}><WebsiteManager/);
  console.log('PASS: unified menu order/default, collapsed findings, new-tab button placement, four collapsed Page details accordions and audit navigation wiring. Live browser interaction not validated.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
