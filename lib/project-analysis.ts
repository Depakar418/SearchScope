import type {Check,Report} from './audit';
import type {PageAudit,Run} from './history';
import {normalizeURL} from './url-normalization';
import {auditDiff} from './audit-diff';
import {websiteScores} from './website-scores';
import {comparePages} from './cross-page';
import {currentPageAttempts,websiteFindingGroups} from './website-findings';
import {websiteAuditSummary} from './audit-result';
function observations(before:Report|null,after:Report|null){
 if(!before||!after)return null;
 const metadata=['title','description','canonical','xRobotsTag'] as const;
 const changes=metadata.filter(key=>(before[key]??null)!==(after[key]??null)).map(key=>({field:key,before:before[key]??null,after:after[key]??null}));
 const a=new Map((before.linkResults||[]).map(l=>[normalizeURL(l.url),l])),b=new Map((after.linkResults||[]).map(l=>[normalizeURL(l.url),l]));
 const links=[...b].flatMap(([url,l])=>{const old=a.get(url);return old&&old.state!==l.state?[{url,before:old.state,after:l.state}]:[];});
 return {metadata:changes,contentChanged:before.version===after.version&&before.contentText!==undefined&&after.contentText!==undefined?before.contentText!==after.contentText:null,links,redirects:{before:before.fetch?.redirects??null,after:after.fetch?.redirects??null},note:'Link states compare observed destinations present in both reports. Missing or unchecked destinations are not verified fixes.'};
}
export function issueTopic(id:string){return /title|description|canonical|social-meta/.test(id)?'Metadata':/heading|h1/.test(id)?'Headings':/anchor|link-href|content-sources/.test(id)?'Links':/index|viewport|lang|schema|image/.test(id)?'Technical':'Content';}
export function aggregateIssues(pages:PageAudit[],opportunities=false){
 return websiteFindingGroups(pages).filter(group=>opportunities?group.severity==='opportunity':group.severity!=='opportunity').map(group=>({...group,topic:issueTopic(group.id),affected:group.pages.reduce((sum,p)=>sum+p.check.affectedCount,0)}));
}
export function linkGraph(run:Run,pages:PageAudit[]){
 const aliases=new Map<string,string>();for(const p of pages){aliases.set(normalizeURL(p.url),normalizeURL(p.url));if(p.report?.fetch?.finalURL)aliases.set(normalizeURL(p.report.fetch.finalURL),normalizeURL(p.url));}
 const key=(url:string)=>aliases.get(normalizeURL(url))||normalizeURL(url);const incoming=new Map<string,Set<string>>(),outgoing=new Map<string,Set<string>>();
 for(const p of pages)for(const link of p.report?.linkInventory||[]){if(!link.internal||!link.url||link.type==='fragment')continue;const a=key(p.url),b=key(link.url);if(a===b)continue;const out=outgoing.get(a)||new Set<string>(),into=incoming.get(b)||new Set<string>();out.add(b);into.add(a);outgoing.set(a,out);incoming.set(b,into);}
 return{coverage:`${pages.filter(p=>p.report).length} reports from ${run.inventory.pages.length} discovered URLs. Relationships are limited to fetched initial HTML.`,pages:run.inventory.pages.map(p=>({url:p.url,incoming:[...(incoming.get(key(p.url))||[])],outgoing:[...(outgoing.get(key(p.url))||[])],note:incoming.get(key(p.url))?.size?'Internal references found':'No internal links found within crawled pages'}))};
}
export function compareRuns(before:{run:Run;pages:PageAudit[]},after:{run:Run;pages:PageAudit[]}){
 before={...before,pages:currentPageAttempts(before.pages)};after={...after,pages:currentPageAttempts(after.pages)};
 const old=new Map(before.pages.map(p=>[normalizeURL(p.url),p])),current=new Map(after.pages.map(p=>[normalizeURL(p.url),p]));
 const changes=[...current].map(([url,p])=>{const previous=old.get(url);const diff=auditDiff(previous?.status==='completed'?previous.report:null,p.status==='completed'?p.report:null);return{url,before:previous?.status||'not audited',after:p.status,errorBefore:previous?.error||null,errorAfter:p.error,observations:observations(previous?.status==='completed'?previous.report:null,p.status==='completed'?p.report:null),...diff};});
 const a=new Set(before.run.selected.map(p=>normalizeURL(p.url))),b=new Set(after.run.selected.map(p=>normalizeURL(p.url)));
 const from=websiteScores(before.pages.flatMap(p=>p.report?[p.report]:[])),to=websiteScores(after.pages.flatMap(p=>p.report?[p.report]:[]));const comparable=changes.some(c=>!c.baseline&&!('scopeChanged' in c&&c.scopeChanged)&&c.scoreChanges!==null);
 const counts=(pages:PageAudit[])=>Object.fromEntries(['error','warning','pass'].map(s=>[s,pages.reduce((n,p)=>n+(p.report?.checks.filter(c=>c.severity===s).length||0),0)]));
 const beforeCoverage=websiteAuditSummary(before.pages,before.run.inventory.pages.length,before.run.selected.length).coverage,afterCoverage=websiteAuditSummary(after.pages,after.run.inventory.pages.length,after.run.selected.length).coverage;
 return{coverage:{before:beforeCoverage,after:afterCoverage,change:beforeCoverage.percent===null||afterCoverage.percent===null?null:afterCoverage.percent-beforeCoverage.percent},unchanged:changes.reduce((n,c)=>n+c.unchanged.length,0),before:before.run.id,after:after.run.id,dates:{before:before.run.created,after:after.run.created},scores:{before:from,after:to},findingCounts:{before:websiteAuditSummary(before.pages,before.run.inventory.pages.length,before.run.selected.length).findings,after:websiteAuditSummary(after.pages,after.run.inventory.pages.length,after.run.selected.length).findings},counts:{before:counts(before.pages),after:counts(after.pages)},discovery:{before:before.run.inventory.pages.length,after:after.run.inventory.pages.length},duplicates:{before:comparePages(before.pages),after:comparePages(after.pages)},changes,addedToSelection:[...b].filter(u=>!a.has(u)),removedFromSelection:[...a].filter(u=>!b.has(u)),resolved:changes.reduce((n,c)=>n+c.resolved.length,0),introduced:changes.reduce((n,c)=>n+c.introduced.length,0),comparable,note:'Finding counts group check ID, category and severity across current audited pages. Legacy counts are technical per-page evaluations. Added/removed URLs refer to audit selections, not confirmed website additions or deletions. Fix counts compare successful reports with matching extraction versions and target phrases only; failures and missing reports are not fixes. Whole-audit scores and counts describe each snapshot and can change with coverage.'};
}
