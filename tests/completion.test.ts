import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {analyze,type Report} from '../lib/audit';
import {normalizedSourceDate} from '../lib/source-signals';
import {canonicalVerification,checkLinks,linkVerification,type LinkResult} from '../lib/link-analysis';
import {canonicalCheckResult,websiteAuditSummary,checklistScores} from '../lib/audit-result';
import {reportExportData,reportCSV,reportMarkdown} from '../lib/report-export';
import {auditDiff} from '../lib/audit-diff';
import {comparePages} from '../lib/cross-page';
import {currentPageAttempts,websiteFindingGroups} from '../lib/website-findings';
import {scopedFindings,findingPriorityReason} from '../lib/report-tabs';
import {analyzePageIntelligence} from '../lib/content-intelligence';
import {SourceSignalReport} from '../app/source-signal-report';
import {FindingDetails} from '../app/report-panels';
import {WebsiteOverview} from '../app/website-overview';
import type {PageAudit} from '../lib/history';

const fixtures=JSON.parse(readFileSync('tests/fixtures/completion-cases.json','utf8')) as {id:string;name:string;html:string}[];
const report=(id:string)=>analyze(fixtures.find(f=>f.id===id)!.html,'https://example.com/training','','url');
const row=(r:Report,url=r.label):PageAudit=>({id:url,url,audited:'2026-10-05',status:'completed',error:null,type:'Page',typeSource:'fixture',report:r});
const outcome=(status:number|null,extra:Partial<LinkResult>={}):LinkResult=>({url:'https://example.com/target',internal:true,status,state:status===404?'broken':status===200?'ok':'unverified',finalURL:status?'https://example.com/target':null,redirects:[],error:null,checkedAt:status?'2026-10-05':null,method:'HEAD',...extra});
const sourceFetch=globalThis.fetch;
// Actual bounded verifier executes against controlled DNS/robots/HTTP fixtures, no outbound requests.
async function verified(r:Report){
 globalThis.fetch=async(input)=>{const u=new URL(String(input));
  if(u.hostname==='cloudflare-dns.com')return Response.json({Answer:u.searchParams.get('type')==='A'?[{type:1,data:'93.184.216.34'}]:[]});
  if(u.pathname==='/robots.txt')return new Response('User-agent: *\nAllow: /');
  if(u.pathname==='/redirect')return new Response(null,{status:301,headers:{location:'/target'}});
  if(u.pathname==='/timeout')throw Error('Request timed out');
  return new Response(null,{status:u.pathname==='/notfound'?404:200});
 };
 try{r.linkResults=await checkLinks(r);return r;}finally{globalThis.fetch=sourceFetch;}
}
for(const fixture of fixtures)test(`fixture ${fixture.id}: ${fixture.name}`,async()=>{
 const r=report(fixture.id);assert.equal(r.checks.length,29);assert.deepEqual(r.scores,checklistScores(r.checks));
 for(const c of r.checks){const projection=canonicalCheckResult(c,r);assert.ok(projection.evidence.length);assert.ok(projection.limitation);assert.ok(projection.detectionConfidence);}
 switch(fixture.id){
  case 'A':assert.equal(r.checks.find(c=>c.id==='title')!.status,'pass');assert.equal(r.sourceSignals!.answers[0].signal,'Structured answer');break;
  case 'B':assert.equal(r.checks.find(c=>c.id==='title')!.status,'fail');break;
  case 'C':assert.equal(r.checks.find(c=>c.id==='alt')!.status,'review');assert.equal(r.checks.find(c=>c.id==='alt')!.evidenceItems![0].attributes!.src,'/team.webp');break;
  case 'D':case 'E':case 'F':await verified(r);assert.equal(linkVerification(r.linkResults![0]).state,fixture.id==='D'?'VERIFIED_4XX':fixture.id==='E'?'VERIFIED_2XX':'TIMEOUT');assert.equal(linkVerification(r.linkResults![0]).broken,fixture.id==='D');break;
  case 'G':case 'H':case 'I':await verified(r);assert.equal(canonicalVerification(r).state,fixture.id==='G'?'TARGET_200':fixture.id==='H'?'TARGET_REDIRECTED':'TARGET_404');assert.equal(canonicalVerification(r).finalURLMatch,fixture.id!=='H');break;
  case 'J':assert.equal(r.sourceSignals!.freshness!.status,'NO_FRESHNESS_SIGNAL');assert.equal(canonicalCheckResult(r.checks.find(c=>c.id==='content-date')!,r).findingType,'OBSERVATION');break;
  case 'K':assert.equal(r.sourceSignals!.freshness!.status,'FRESHNESS_SIGNAL_CONFLICT');assert.equal(r.checks.find(c=>c.id==='content-date')!.status,'review');break;
  case 'L':case 'M':case 'N':assert.equal(r.sourceSignals!.answers[0].signal,fixture.id==='L'?'Direct answer':fixture.id==='M'?'Weak answer':'No clear answer');assert.equal(r.sourceSignals!.answers[0].status,'REVIEW');break;
  case 'O':assert.ok(r.sourceSignals!.entities.some(e=>e.value==='SucceedLEARN'&&e.type==='Organization'&&e.confidence==='High'));assert.ok(r.sourceSignals!.entities.some(e=>e.type==='Location'));break;
  case 'P':assert.ok(r.sourceSignals!.entities.some(e=>e.type==='Technology'&&e.value==='WordPress'));assert.ok(r.sourceSignals!.entities.some(e=>e.type==='Regulatory subject'));break;
  case 'Q':assert.ok(comparePages([row(r,'https://example.com/a'),row(r,'https://example.com/b')]).groups.some(g=>g.kind==='Duplicate title'));break;
  case 'R':assert.ok(comparePages([row(r,'https://example.com/a'),row(r,'https://example.com/b')]).groups.some(g=>g.kind==='Similar content'));break;
  case 'S':assert.equal(websiteAuditSummary([row(r)],4,3).coverage.percent,33);break;
  case 'T':{const p={...row(r),status:'failed' as const,report:null,fetch:{errorType:'robots-blocked'}} as PageAudit;assert.equal(websiteAuditSummary([p],1,1).coverage.blocked,1);assert.equal(websiteAuditSummary([p],1,1).coverage.failed,0);break;}
  case 'U':assert.equal(websiteAuditSummary([{...row(r),status:'failed',report:null}],1,1).completed,0);break;
  case 'V':for(const state of ['pass','fail','review'])assert.ok(r.checks.some(c=>c.status===state));break;
 }
});
test('freshness rejects rollover and reconciles metadata/intelligence',()=>{
 assert.equal(normalizedSourceDate('2026-02-30'),null);assert.equal(normalizedSourceDate('2024-02-29'),'2024-02-29');assert.equal(normalizedSourceDate('2026-09-01T25:00Z'),null);
 const r=analyze('<meta property="article:modified_time" content="garbage"><main><time datetime="2026-02-30">Updated today</time></main>','https://example.com');
 r.auditContext={projectId:'p',pageId:'page',auditId:'run',requestedURL:r.label,pageType:'Page',depth:0,discoverySource:'fixture',referringURL:null};
 assert.equal(r.sourceSignals!.freshness!.status,'INVALID_DATE_SIGNAL');assert.equal(r.sourceSignals!.freshness!.signals.length,2);assert.equal(r.checks.find(c=>c.id==='content-date')!.evidenceItems!.length,2);
 assert.equal(analyzePageIntelligence(r,'Page').contentStrength.signals.find(s=>s.label==='Freshness')!.state,'not measured');
});
test('old date is a declaration, different published/modified dates need not conflict',()=>{
 const r=analyze('<meta property="article:published_time" content="2001-01-01"><main><p>Last updated: 2026-09-18</p></main>','https://example.com');assert.equal(r.sourceSignals!.freshness!.status,'MULTIPLE_FRESHNESS_SIGNALS');assert.equal(r.sourceSignals!.freshness!.conflicts.length,0);assert.doesNotMatch(r.checks.find(c=>c.id==='content-date')!.evidence,/outdated/);
});
test('list, table, paragraph questions and next-section boundaries',()=>{
 const r=analyze('<main><h2>How to practice</h2><ul><li>Practice the important skills in realistic exercises with feedback.</li></ul><h2>Which option?</h2><table><tr><th>Option</th><td>Compare both relevant approaches carefully.</td></tr></table><p>What is safety? Safety is a process of identifying hazards and taking appropriate precautions.</p><h2>Why?</h2><h2>Other content</h2><p>Unrelated text must not be treated as the earlier answer.</p></main>','https://example.com');
 assert.ok(r.sourceSignals!.answers.some(q=>q.format==='List'));assert.ok(r.sourceSignals!.answers.some(q=>q.format==='Table'||q.format==='Mixed'));assert.ok(r.sourceSignals!.answers.some(q=>q.question==='What is safety?'));assert.equal(r.sourceSignals!.answers.find(q=>q.question==='Why?')!.signal,'No clear answer');
});
test('unverified link outcomes and canonical states never imply broken',()=>{
 for(const [errorType,state] of [['robots-blocked','BLOCKED'],['timeout','TIMEOUT'],['budget','BUDGET_EXHAUSTED'],['network','REQUEST_ERROR']] as const){const r=outcome(null,{errorType,error:'Request could not complete'});assert.equal(linkVerification(r).state,state);assert.equal(linkVerification(r).broken,false);}
 assert.equal(linkVerification(outcome(503)).state,'VERIFIED_5XX');assert.equal(linkVerification(outcome(503)).broken,false);assert.equal(linkVerification(outcome(403)).state,'BLOCKED');assert.equal(linkVerification(outcome(null)).state,'NOT_VERIFIED');assert.equal(linkVerification(outcome(302)).state,'VERIFIED_3XX');
 const r=report('G');r.linkResults=[outcome(null,{errorType:'budget',error:'Budget reached',state:'unchecked'})];assert.equal(canonicalVerification(r).state,'TARGET_NOT_VERIFIED');assert.equal(canonicalVerification(r).budgetUnavailable,true);
 r.linkResults=[outcome(null,{errorType:'robots-blocked',error:'Permission denied'})];assert.equal(canonicalVerification(r).state,'TARGET_BLOCKED');r.linkResults=[outcome(null,{errorType:'timeout',error:'Timed out'})];assert.equal(canonicalVerification(r).state,'TARGET_TIMEOUT');
 assert.equal(canonicalVerification(analyze('<link rel="canonical" href="javascript:void(0)">','https://example.com')).state,'INVALID_SYNTAX');
});
test('canonical consumes the existing link budget and unknown cache remains unverified',async()=>{
 const r=report('G');r.linkResults=await checkLinks(r,{maxLinks:0});assert.equal(r.linkResults.length,1);assert.equal(linkVerification(r.linkResults[0]).state,'BUDGET_EXHAUSTED');assert.equal(canonicalVerification(r).state,'TARGET_NOT_VERIFIED');
});
test('phrase and whitespace href evidence agree with checks',()=>{
 const r=analyze('<main><p>partial</p><a href=" javascript:void(0)">Action</a></main>','https://example.com','art');assert.equal(r.keywordStats.occurrences,0);assert.equal(r.checks.find(c=>c.id==='content-keyword')!.status,'review');assert.equal(r.checks.find(c=>c.id==='link-href')!.status,'review');assert.equal(r.checks.find(c=>c.id==='link-href')!.evidenceItems![0].attributes!.href,' javascript:void(0)');
});
test('valid latest failure suppresses unknown older success in either array order',()=>{
 const r=report('V'),old={...row(r),audited:''},failed={...row(r),audited:'2026-10-05',status:'failed' as const,report:null};for(const pages of [[old,failed],[failed,old]]){assert.equal(currentPageAttempts(pages)[0].status,'failed');assert.equal(websiteFindingGroups(pages).length,0);assert.equal(comparePages(pages).compared,0);}
});
test('coverage and finding/page/element/occurrence/evaluation denominators reconcile',()=>{
 const r=report('C'),pages=[row(r,'https://example.com/a'),row(r,'https://example.com/b'),{...row(r,'https://example.com/blocked'),status:'failed' as const,report:null,fetch:{errorType:'robots-blocked'}} as PageAudit,{...row(r,'https://example.com/failed'),status:'failed' as const,report:null}];
 const summary=websiteAuditSummary(pages,8,5);assert.deepEqual([summary.coverage.analyzed,summary.coverage.blocked,summary.coverage.failed,summary.coverage.pending,summary.coverage.skipped,summary.coverage.percent],[2,1,1,1,3,40]);assert.equal(summary.technical.evaluations,58);assert.ok(summary.findings.occurrences>summary.findings.uniqueFindingTypes);assert.equal(summary.findings.affectedPages,2);assert.ok(summary.findings.affectedElements>=2);
});
test('Fix-first severity/priority/elements/confidence/stable-ID ordering is deterministic',()=>{
 const r=report('V'),base=r.checks.find(c=>c.id==='alt')!;r.checks=[{...base,id:'z',affectedCount:1},{...base,id:'b',affectedCount:5,confidence:'heuristic'},{...base,id:'a',affectedCount:5,confidence:'observed'},{...base,id:'first',severity:'error',priority:'High',affectedCount:0}];assert.deepEqual(scopedFindings(r,'fix-first').map(c=>c.id),['first','a','b','z']);assert.match(findingPriorityReason(r.checks[0],34),/34 affected pages/);
});
test('verify-fix requires compatible PASS; unavailable, failure, changed version are not fixes',()=>{
 const before=report('C'),after=analyze('<main><img src="/team.webp" alt="Team learning"></main>',before.label,'','url');const diff=auditDiff(before,after);assert.ok(diff.resolved.includes('alt'));assert.deepEqual(diff.transitions.find(t=>t.checkId==='alt'),{checkId:'alt',before:'REVIEW',after:'PASS',state:'RESOLVED'});
 const absent=analyze('<main></main>',before.label,'','url');assert.ok(!auditDiff(before,absent).resolved.includes('alt'));assert.equal(auditDiff(before,null).resolved.length,0);assert.equal(auditDiff({...before,version:'1.5.0'},after).scoreChanges,null);assert.ok(auditDiff(after,before).introduced.includes('alt'));assert.ok(auditDiff(before,before).unchanged.includes('alt'));
});
test('JSON CSV Markdown preserve identical canonical projection without audit/mutation',()=>{
 const r=report('V');r.auditContext={projectId:'p',pageId:'page',auditId:'run',requestedURL:r.label,pageType:'Page',depth:0,discoverySource:'fixture',referringURL:null};const original=JSON.stringify(r),data=reportExportData(r),csv=reportCSV(r),md=reportMarkdown(r);assert.match(csv,/Audit ID,Check ID,Finding type,Detection confidence,Limitation,Finding projection/);
 for(const c of r.checks){const projection=canonicalCheckResult(c,r);assert.deepEqual(data.checkResults.find(p=>p.checkId===c.id),projection);assert.ok(md.includes(`Check ID: ${c.id}`));assert.ok(md.includes(JSON.stringify(projection,null,2)));assert.ok(csv.includes(JSON.stringify(projection).replaceAll('"','""')));}
 assert.equal(JSON.stringify(r),original);
});
test('report rendering shows evidence/limitations/coverage and escaped content',()=>{
 const r=report('L'),signals=renderToStaticMarkup(React.createElement(SourceSignalReport,{report:r}));for(const text of ['Answer signals','Direct answer','REVIEW','Medium detection confidence','Limitation','Freshness signals','Canonical target'])assert.ok(signals.includes(text));
 const details=renderToStaticMarkup(React.createElement(FindingDetails,{report:r,finding:r.checks.find(c=>c.id==='content-question')!}));for(const text of ['What we found','Why it matters','Where','What to fix','How to verify','Limitation'])assert.ok(details.includes(text));
 const overview=renderToStaticMarkup(React.createElement(WebsiteOverview,{pages:[row(r)],discovered:4,selected:2}));assert.match(overview,/50% of selected analyzed/);assert.match(overview,/finding types/);assert.match(overview,/check evaluations/);assert.match(signals,/<details/);assert.doesNotMatch(signals,/<details[^>]* open/);
});

test('relative pasted canonical has usable syntax but no invented target URL',()=>{const r=analyze('<link rel="canonical" href="/preferred">','HTML');const v=canonicalVerification(r);assert.equal(v.syntax,'VALID');assert.equal(v.resolved,null);assert.equal(v.state,'TARGET_NOT_VERIFIED');});

test('question candidates and intelligence use the same detector',()=>{const r=analyze('<main><h2>How to practice</h2><p>Practice relevant skills carefully, then review the outcome with useful feedback.</p></main>','https://example.com');r.auditContext={projectId:'p',pageId:'page',auditId:'run',requestedURL:r.label,pageType:'Page',depth:0,discoverySource:'fixture',referringURL:null};const intelligence=analyzePageIntelligence(r,'Page');assert.equal(intelligence.questions.length,r.sourceSignals!.answers.length);assert.equal(intelligence.questions.length,1);assert.equal(r.checks.find(c=>c.id==='content-question')!.affectedCount,0);assert.equal(r.checks.find(c=>c.id==='content-question')!.status,'pass');});
