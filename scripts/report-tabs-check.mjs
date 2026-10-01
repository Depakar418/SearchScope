import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'searchscope-tabs-'));
try{
  const source=await fs.readFile('lib/report-tabs.ts','utf8');
  await fs.writeFile(path.join(dir,'tabs.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {openReportTab,scopedFindings,REPORT_TAB_KEY}=await import(path.join(dir,'tabs.mjs'));
  const report={label:'https://example.com',checks:[{id:'low',category:'SEO',severity:'warning',priority:'Low'},{id:'error',category:'SEO',severity:'error',priority:'High'},{id:'passed',category:'SEO',severity:'pass',priority:'Low'},{id:'geo',category:'GEO',severity:'opportunity',priority:'Medium'}]};
  assert.deepEqual(scopedFindings(report,'SEO').map(c=>c.id),['error','low']);
  assert.equal(scopedFindings(report,'SEO',true).length,3);
  assert.deepEqual(scopedFindings(report,'fix-first').map(c=>c.id),['error','low','geo']);
  const storage=new Map();let snapshot;let url;let child;
  globalThis.sessionStorage={setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  globalThis.window={open:(u,target)=>{assert.equal(target,'_blank');url=u;snapshot=new Map(storage);child={opener:{}};return child;}};
  openReportTab(report,'SEO');
  const query=new URL(url,'https://app.example').searchParams;
  assert.equal(query.get('scope'),'SEO');
  assert.deepEqual(JSON.parse(snapshot.get(REPORT_TAB_KEY+query.get('report'))),report);
  assert.equal(child.opener,null);assert.equal(storage.size,0);
  window.open=()=>null;assert.throws(()=>openReportTab(report,'fix-first'),/blocked/);assert.equal(storage.size,0);
  console.log('PASS: report scopes, priority sorting, new-tab snapshots, opener isolation and popup-blocked cleanup. Browser session cloning still needs live browser validation.');
}finally{await fs.rm(dir,{recursive:true,force:true});}
