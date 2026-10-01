import type {Check,Report} from './audit';
import type {PageAudit,Run} from './history';
import {normalizeURL} from './url-normalization';
import {auditDiff} from './audit-diff';
import {websiteScores} from './website-scores';
export function issueTopic(id:string){return /title|description|canonical|social-meta/.test(id)?'Metadata':/heading|h1/.test(id)?'Headings':/anchor|link-href|content-sources/.test(id)?'Links':/index|viewport|lang|schema|image/.test(id)?'Technical':'Content';}
export function aggregateIssues(pages:PageAudit[],opportunities=false){
 const groups=new Map<string,{id:string;name:string;category:string;severity:string;topic:string;pages:{url:string;check:Check;report:Report}[];affected:number}>();
 for(const p of pages){if(!p.report)continue;for(const check of p.report.checks){if(opportunities?check.severity!=='opportunity':check.severity==='opportunity')continue;const key=check.id+':'+check.severity;const group=groups.get(key)||{id:check.id,name:check.name,category:check.category,severity:check.severity,topic:issueTopic(check.id),pages:[],affected:0};group.pages.push({url:p.url,check,report:p.report});group.affected+=check.affectedCount;groups.set(key,group);}}
 return [...groups.values()].sort((a,b)=>['error','warning','opportunity','unavailable','pass'].indexOf(a.severity)-['error','warning','opportunity','unavailable','pass'].indexOf(b.severity)||b.pages.length-a.pages.length);
}
export function linkGraph(run:Run,pages:PageAudit[]){
 const aliases=new Map<string,string>();for(const p of pages){aliases.set(normalizeURL(p.url),normalizeURL(p.url));if(p.report?.fetch?.finalURL)aliases.set(normalizeURL(p.report.fetch.finalURL),normalizeURL(p.url));}
 const key=(url:string)=>aliases.get(normalizeURL(url))||normalizeURL(url);const incoming=new Map<string,Set<string>>(),outgoing=new Map<string,Set<string>>();
 for(const p of pages)for(const link of p.report?.linkInventory||[]){if(!link.internal||!link.url||link.type==='fragment')continue;const a=key(p.url),b=key(link.url);if(a===b)continue;const out=outgoing.get(a)||new Set<string>(),into=incoming.get(b)||new Set<string>();out.add(b);into.add(a);outgoing.set(a,out);incoming.set(b,into);}
 return{coverage:`${pages.filter(p=>p.report).length} reports from ${run.inventory.pages.length} discovered URLs. Relationships are limited to fetched initial HTML.`,pages:run.inventory.pages.map(p=>({url:p.url,incoming:[...(incoming.get(key(p.url))||[])],outgoing:[...(outgoing.get(key(p.url))||[])],note:incoming.get(key(p.url))?.size?'Internal references found':'No internal links found within crawled pages'}))};
}
export function compareRuns(before:{run:Run;pages:PageAudit[]},after:{run:Run;pages:PageAudit[]}){
 const old=new Map(before.pages.map(p=>[normalizeURL(p.url),p])),current=new Map(after.pages.map(p=>[normalizeURL(p.url),p]));
 const changes=[...current].map(([url,p])=>{const previous=old.get(url);const diff=auditDiff(previous?.report||null,p.report);return{url,before:previous?.status||'not audited',after:p.status,errorBefore:previous?.error||null,errorAfter:p.error,...diff};});
 const a=new Set(before.run.selected.map(p=>normalizeURL(p.url))),b=new Set(after.run.selected.map(p=>normalizeURL(p.url)));
 const from=websiteScores(before.pages.flatMap(p=>p.report?[p.report]:[])),to=websiteScores(after.pages.flatMap(p=>p.report?[p.report]:[]));const comparable=changes.some(c=>!c.baseline&&!('scopeChanged' in c&&c.scopeChanged)&&c.scoreChanges!==null);
 return{before:before.run.id,after:after.run.id,dates:{before:before.run.created,after:after.run.created},scores:{before:from,after:to},changes,addedToSelection:[...b].filter(u=>!a.has(u)),removedFromSelection:[...a].filter(u=>!b.has(u)),resolved:changes.reduce((n,c)=>n+c.resolved.length,0),introduced:changes.reduce((n,c)=>n+c.introduced.length,0),comparable,note:'Added/removed URLs refer to audit selections, not confirmed website additions or deletions. Fix counts compare successful reports with matching extraction versions and target phrases only; failures and missing reports are not fixes.'};
}
