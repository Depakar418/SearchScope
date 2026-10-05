import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyze,SAMPLE,type Report} from '../lib/audit';
import {canonicalCheckResult,checkCounts,scoreMethodology,resultState,websiteAuditSummary} from '../lib/audit-result';
import {reportCSV,reportMarkdown,reportJSON} from '../lib/report-export';
import {comparePages} from '../lib/cross-page';
import {auditDiff} from '../lib/audit-diff';
import {scopedFindings} from '../lib/report-tabs';
const check=(source:string,id:string,mode='html')=>analyze(source,'https://example.com/training','',mode).checks.find(c=>c.id===id)!;
const cases:[string,string,string,string][]=[
 ['title','<title>   </title>','fail','blank title'],
 ['description','<meta name="description" content="   ">','review','blank description'],
 ['h1','<main><h1>A</h1><h1>B</h1></main>','review','multiple main headings'],
 ['canonical','<link rel="canonical" href="   ">','review','blank canonical'],
 ['index','<meta name="robots" content="noindex">','review','intentional noindex requires context'],
 ['alt','<img src="x">','review','missing attribute'],
 ['alt','<img src="x" alt="">','pass','decorative empty alternative'],
 ['alt','<main><p>No images</p></main>','na','no images excluded'],
 ['lang','<html lang="  "></html>','review','blank language'],
 ['viewport','<meta name="viewport" content="initial-scale=1">','review','no responsive width'],
 ['viewport','<meta name="viewport" content="width=1024">','review','fixed width'],
 ['viewport','<meta name="viewport" content="WIDTH = device-width, initial-scale=1">','pass','responsive width'],
 ['content-structure','<main><h2>Section</h2></main>','pass','main structure'],
 ['content-question','<nav><h2>Why?</h2></nav><main><p>Content</p></main>','review','navigation excluded'],
 ['content-list','<main><ol><li>Step</li></ol></main>','pass','main list'],
 ['schema','<script type="application/ld+json">{broken}</script>','fail','invalid JSON'],
 ['schema','<script type="Application/LD+JSON">{"@type":"Article"}</script>','pass','case insensitive MIME and evidence'],
 ['content-attribution','<script>var author="Alice";</script><main><p>Article</p></main>','review','arbitrary JS ignored'],
 ['content-date','<main><time datetime="2026-02-30">Invalid calendar day</time></main>','review','calendar rollover rejected'],
 ['content-date','<meta property="article:published_time" content="2024-02-29">','pass','valid leap date'],
 ['schema','<script type="application/ld+json">{"@type":{"invalid":true}}</script>','review','object is not a schema type'],
 ['canonical-count','<link rel="canonical" href="/training"><link rel="canonical" href="https://example.com/training">','review','equivalent resolved URLs are repeated declarations'],
 ['content-date','<main><time datetime="garbage">Today</time></main>','review','invalid date'],
 ['content-sources','<nav><a href="https://primary.example/">Study</a></nav><main><p>Article</p></main>','na','navigation is not support'],
 ['title-duplicates','<title>A</title><title>B</title>','fail','duplicate titles'],
 ['description-duplicates','<meta name="description" content="A"><meta name="description" content="B">','review','duplicate descriptions'],
 ['canonical-valid','<link rel="canonical" href="javascript:void(0)">','fail','unsupported protocol'],
 ['canonical-valid','<link rel="canonical" href="https://user:secret@example.com/">','fail','credentials rejected'],
 ['canonical-count','<link rel="canonical" href="https://example.com/a"><link rel="canonical" href="https://example.com/b">','fail','conflicting destinations'],
 ['heading-empty','<main><h1></h1></main>','review','empty heading'],
 ['heading-order','<main><h1>A</h1><h3>B</h3></main>','review','skipped hierarchy'],
 ['image-dimensions','<img src="x" style="aspect-ratio: nonsense">','review','invalid ratio'],
 ['image-dimensions','<img src="x" style="aspect-ratio: 16 / 0">','review','zero ratio denominator'],
 ['image-dimensions','<img src="x" style="ASPECT-RATIO: 16 / 9 !important">','pass','valid ratio'],
 ['image-dimensions','<img src="x" width="Infinity" height="1">','review','nonfinite dimension'],
 ['image-src','<img alt="x">','review','source absent'],
 ['image-src','<img data-src="/x.webp" alt="x">','pass','lazy source observed'],
 ['anchor-text','<a href="/x" aria-label="Read guide"></a>','pass','accessible name'],
 ['link-href','<a href="javascript:void(0)">Open</a>','review','script link is contextual'],
 ['transport','<p>Article</p>','na','HTTPS not measurable from paste'],
 ['content-visible','<script>render()</script>','review','JS shell remains unrendered'],
 ['social-meta','<meta property="og:title" content=" "><meta property="og:description" content=" ">','review','blank social metadata'],
];
for(const [id,source,expected,label] of cases)assert.equal(check(source,id).status,expected,label);
const complete=analyze(readFileSync('tests/fixtures/phase2-complete.html','utf8'),'https://example.com/training','training','url');
complete.date='2026-10-05T00:00:00.000Z';
assert.deepEqual(complete.scores,{SEO:100,AEO:100,GEO:83});
assert.equal(complete.checks.length,29);assert.equal(new Set(complete.checks.map(c=>c.id)).size,29);
assert.equal(new Set(cases.map(c=>c[0])).size,28,'target phrase tested separately completes the registry');
const target=analyze('<p>Training guide</p>','HTML','  training  ');assert.equal(target.checks.find(c=>c.id==='content-keyword')!.status,'pass');assert.equal(target.keyword,'training');
const missing=analyze('<main><p>Article</p></main>','HTML');
for(const id of ['alt','title-duplicates','canonical-valid','heading-order'])assert.equal(resultState(missing.checks.find(c=>c.id===id)!,missing),'NOT_APPLICABLE');
const text=analyze('What is training?\n\nWritten by Alice\n- Practice\n2026-09-01','Text','','text');text.date=complete.date;
assert.equal(text.scores.SEO,null);assert.equal(resultState(text.checks.find(c=>c.id==='title')!,text),'NOT_MEASURED');
const upper=check('<script type="Application/LD+JSON">{"@type":"Article"}</script>','schema');assert.match(upper.evidenceItems![0].snippet||'',/<script type="Application\/LD\+JSON"/);
const historical={...complete,version:'1.4.3'};assert.equal(auditDiff(historical,complete).scoreChanges,null);assert.deepEqual(historical.scores,complete.scores);
for(const category of ['SEO','AEO','GEO'] as const){const m=scoreMethodology(complete,category);assert.equal(m.score,Math.round(100*m.points/m.evaluated));assert.equal(m.total,m.evaluated+m.excluded);}
// Completion goldens reviewed against the preserved Phase 2 goldens; tests never regenerate them.
const sample=analyze(SAMPLE,'Sample','compliance training');sample.date=complete.date;
const projection=(r:Report)=>({version:r.version,scores:r.scores,counts:checkCounts(r),checks:r.checks.map(c=>{const v=canonicalCheckResult(c,r);return {id:v.checkId,category:v.category,status:v.status,severity:v.severity,summary:v.summary,evidence:v.evidence,confidence:v.confidence,scoreContribution:v.scoreContribution};})});
assert.deepEqual(JSON.parse(JSON.stringify({complete:projection(complete),sample:projection(sample),text:projection(text)})),JSON.parse(readFileSync('tests/fixtures/completion-golden.json','utf8')));
const original=JSON.stringify(complete),json=JSON.parse(reportJSON(complete)),csv=reportCSV(complete),md=reportMarkdown(complete);
assert.equal(JSON.stringify(complete),original,'exports must not mutate snapshots');
assert.deepEqual(json.resultCounts,checkCounts(complete));
assert.deepEqual(json.methodology,(['SEO','AEO','GEO'] as const).map(c=>scoreMethodology(complete,c)));
assert.equal(json.checkResults.length,29);assert.match(csv,/Score contribution,Score methodology/);assert.match(md,/Equal weight: PASS = 1 point/);
for(const result of json.checkResults){assert.match(csv,new RegExp(result.status));assert.ok(md.includes(result.summary));assert.equal(result.measuredAt,complete.date);assert.equal(result.engineVersion,complete.version);}
const older={url:'https://example.com/a',id:'old',status:'completed',audited:'2026-10-01',report:complete};
const peer={url:'https://example.com/b',id:'peer',status:'completed',audited:'2026-10-01',report:complete};
const failed={url:older.url,id:'failed',status:'failed',audited:'2026-10-05',report:null};
assert.equal(comparePages([older,peer]).compared,2);
assert.equal(comparePages([older,peer,failed]).compared,1);
assert.equal(comparePages([failed,older,peer]).compared,1,'timestamps govern, not input order');
assert.equal(comparePages([older,peer,{...failed,status:'running'}]).compared,1);
assert.equal(websiteAuditSummary([older,peer,failed] as never,2,2).completed,1);
const priorities=scopedFindings(sample,'fix-first');assert.equal(priorities[0].severity,'error');assert.ok(priorities.every(c=>c.status==='review'||c.status==='fail'));

// Parse complete RFC4180 rows, including multiline evidence, to reconcile every exported cell.
function parseCSV(value:string){const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<value.length;i++){const c=value[i];if(c==='"'){if(quoted&&value[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}row.push(cell);rows.push(row);return rows;}
const [columns,...rows]=parseCSV(csv);assert.equal(rows.length,29);
for(let i=0;i<rows.length;i++){const c=complete.checks[i],row=rows[i];assert.equal(row.length,columns.length);const get=(label:string)=>row[columns.indexOf(label)];assert.equal(get('Check'),c.name);assert.equal(get('Result state'),resultState(c,complete));assert.equal(get('Evidence'),c.evidence);assert.deepEqual(JSON.parse(get('DOM evidence')),JSON.parse(JSON.stringify(c.evidenceItems)));assert.deepEqual(JSON.parse(get('Score contribution')),canonicalCheckResult(c,complete).scoreContribution);assert.deepEqual(JSON.parse(get('Score methodology')),scoreMethodology(complete,c.category));}

assert.deepEqual(canonicalCheckResult(complete.checks[0],complete).affectedPages,[],'a passed check must not identify affected finding pages');
console.log(`PASS: ${cases.length} accuracy cases, all 29 IDs, three pinned golden reports, score exclusions, canonical JSON/CSV/Markdown, immutable history and latest-attempt comparisons.`);
