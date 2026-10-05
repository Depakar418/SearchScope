import type {Check,Report} from './audit';
import type {PageAudit} from './history';

export type WebsiteFindingGroup={id:string;name:string;category:Check['category'];severity:Check['severity'];pages:{url:string;check:Check;report:Report}[];affectedPageCount:number;affectedElementCount:number|null;affectedPages:string[];priorityReason?:string};

/** Keep only the latest saved attempt per exact URL. Valid timestamps outrank unknown timestamps; equal/unknown ties use the last record. A later failed re-audit suppresses stale success. */
export function currentPageAttempts<T extends {url:string;audited?:string}>(pages:T[]):T[]{
 const latest=new Map<string,T>();
 for(const page of pages){const previous=latest.get(page.url);const currentTime=Date.parse(page.audited||''),previousTime=Date.parse(previous?.audited||'');if(!previous||(!Number.isNaN(currentTime)?Number.isNaN(previousTime)||currentTime>=previousTime:Number.isNaN(previousTime)))latest.set(page.url,page);}
 return [...latest.values()];
}

/** A group is one check ID + category + severity across current successful page reports.
 * One page contributes once to a group regardless of repeated saved attempts or affected DOM nodes.
 * Affected-element totals count distinct extracted source selectors per page; page-level absences have no element total.
 */
export function websiteFindingGroups(pages:PageAudit[]):WebsiteFindingGroup[]{
 const groups=new Map<string,WebsiteFindingGroup>();
 for(const page of currentPageAttempts(pages)){
  if(page.status!=='completed'||!page.report)continue;
  for(const check of page.report.checks){
   const key=[check.category,check.id,check.severity].join(':');
   const group=groups.get(key)||{id:check.id,name:check.name,category:check.category,severity:check.severity,pages:[],affectedPageCount:0,affectedElementCount:null,affectedPages:[]};
   group.pages.push({url:page.url,check,report:page.report});group.affectedPages.push(page.url);group.affectedPageCount++;
   const selectors=new Set((check.evidenceItems||[]).filter(e=>e.kind==='element'&&e.selector).map(e=>e.selector));
   if(selectors.size)group.affectedElementCount=(group.affectedElementCount||0)+selectors.size;
   groups.set(key,group);
  }
 }
 const order={error:0,warning:1,opportunity:2,unavailable:3,pass:4};
 const priority={High:0,Medium:1,Low:2};
 for(const g of groups.values())g.priorityReason=`${g.severity} severity · ${g.pages[0].check.priority} guide priority · ${g.affectedPageCount} affected pages · ${g.affectedElementCount??0} identified elements · ${g.pages[0].check.confidence==='observed'?'High':'Medium'} detection confidence${g.affectedPageCount>1?' · pattern across audited pages':''}. No ranking or traffic impact is predicted.`;
 return [...groups.values()].sort((a,b)=>order[a.severity]-order[b.severity]||priority[a.pages[0].check.priority]-priority[b.pages[0].check.priority]||b.affectedPageCount-a.affectedPageCount||(b.affectedElementCount??0)-(a.affectedElementCount??0)||Number(b.pages[0].check.confidence==='observed')-Number(a.pages[0].check.confidence==='observed')||a.id.localeCompare(b.id));
}
