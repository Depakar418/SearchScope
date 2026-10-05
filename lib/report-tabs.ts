import type {Report,Category} from './audit';
export type ReportScope=Category|'fix-first';
export const REPORT_TAB_KEY='searchscope-report-tab:';

// Browser-only report snapshot. No network request or repeated audit is needed.
export function openReportTab(report:Report,scope:ReportScope){
  const id=crypto.randomUUID();
  const key=REPORT_TAB_KEY+id;
  sessionStorage.setItem(key,JSON.stringify(report));
  const opened=window.open(`/findings?report=${encodeURIComponent(id)}&scope=${scope}`,'_blank');
  if(!opened){sessionStorage.removeItem(key);throw new Error('Your browser blocked the new tab. Allow pop-ups for this site and try again.');}
  // A same-origin new tab gets its own copy of sessionStorage at creation.
  // Remove its opener immediately so later external navigation cannot access it.
  opened.opener=null;
  sessionStorage.removeItem(key);
}

export function findingPriorityReason(check:Report['checks'][number],affectedPages=1){return `${check.severity} severity · ${check.priority} guide priority · ${affectedPages} affected page${affectedPages===1?'':'s'} · ${check.affectedCount} affected occurrences · ${check.confidence==='observed'?'High':'Medium'} detection confidence. Ordered from captured scope and source evidence; no traffic, ranking or revenue impact is predicted.`;}

export function scopedFindings(report:Report,scope:ReportScope,allChecks=false){
  const severity={error:0,warning:1,opportunity:2,pass:3,unavailable:4};
  const priority={High:0,Medium:1,Low:2};
  return report.checks.filter(c=>(scope==='fix-first'||c.category===scope)&&
    (scope!=='fix-first'&&allChecks||['error','warning','opportunity'].includes(c.severity)))
    .sort((a,b)=>severity[a.severity]-severity[b.severity]||priority[a.priority]-priority[b.priority]||b.affectedCount-a.affectedCount||Number(b.confidence==='observed')-Number(a.confidence==='observed')||a.id.localeCompare(b.id));
}
