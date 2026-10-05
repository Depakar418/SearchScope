// Controlled in-process benchmark. This measures no network, crawl, browser or production latency.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {analyze} from '../lib/audit';
import {comparePages} from '../lib/cross-page';
import {websiteAuditSummary} from '../lib/audit-result';
import {websiteScores} from '../lib/website-scores';
import {reportJSON} from '../lib/report-export';
console.log('Offline generated-source benchmark; milliseconds; heap samples are process-wide, not retained dataset size.');
console.log('pages,analysis_ms,comparison_ms,summary_scores_export_ms,total_ms,sampled_heap_mb');
for(const count of [10,25,50,100,127,200]){
 const start=performance.now();let heap=process.memoryUsage().heapUsed;
 const pages=Array.from({length:count},(_,i)=>{
  const unique=Array.from({length:100},(_,w)=>`page${i}term${w}`).join(' ');
  const html=`<!doctype html><html lang="en"><head><title>Page ${i}</title><meta name="description" content="Page ${i} description"><meta name="viewport" content="width=device-width"></head><body><header><nav>Shared navigation</nav></header><main><h1>Page ${i}</h1><h2>How is it used?</h2><p>${unique}</p><img src="/p${i}.webp" alt="Page ${i}" width="600" height="400"><a href="/guide">Read guide</a></main><footer>Shared footer</footer></body></html>`;
  const report=analyze(html,`https://example.com/p${i}`,'','url');
  heap=Math.max(heap,process.memoryUsage().heapUsed);
  return {id:`p${i}`,url:report.label,status:'completed',audited:report.date,report};
 });
 const parsed=performance.now(),comparison=comparePages(pages),compared=performance.now();
 assert.equal(comparison.compared,count);assert.equal(comparison.groups.length,0);
 const summary=websiteAuditSummary(pages as never,count,count),scores=websiteScores(pages.map(p=>p.report));
 assert.equal(summary.completed,count);assert.equal(summary.technical.evaluations,count*29);assert.ok(scores.overall!==null);
 for(const page of pages)assert.equal(JSON.parse(reportJSON(page.report)).checkResults.length,29);
 heap=Math.max(heap,process.memoryUsage().heapUsed);const end=performance.now();
 console.log([count,parsed-start,compared-parsed,end-compared,end-start,heap/1024/1024].map((v,i)=>i?v.toFixed(2):v).join(','));
}
