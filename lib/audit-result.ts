import type {Category,Check,Report} from './audit';

export type ResultState='PASS'|'FAIL'|'REVIEW'|'NOT_APPLICABLE'|'NOT_MEASURED'|'BLOCKED'|'ERROR';
const entityDependent=new Set(['canonical-valid','canonical-count','description-duplicates','heading-empty','heading-order','image-dimensions','image-src','anchor-text','link-href']);
/** Maps the 29 existing checks to explicit result states without inventing a measurement. */
export function resultState(check:Check,report:Pick<Report,'mode'|'keyword'>):ResultState{
 if(check.status==='pass')return 'PASS';
 if(check.status==='fail')return 'FAIL';
 if(check.status==='review')return 'REVIEW';
 if(report.mode==='text'&&!check.id.startsWith('content'))return 'NOT_MEASURED';
 if(check.id==='content-keyword'&&!report.keyword)return 'NOT_APPLICABLE';
 if(check.id==='transport'&&report.mode!=='url')return 'NOT_MEASURED';
 return entityDependent.has(check.id)?'NOT_APPLICABLE':'NOT_MEASURED';
}
export function checklistScores(checks:Check[]):Record<Category,number|null>{
 return Object.fromEntries((['SEO','AEO','GEO'] as const).map(category=>{
  const measured=checks.filter(c=>c.category===category&&['pass','review','fail'].includes(c.status));
  return [category,measured.length?Math.round(measured.reduce((sum,c)=>sum+(c.status==='pass'?1:c.status==='review'?.5:0),0)/measured.length*100):null];
 })) as Record<Category,number|null>;
}
export function checkCounts(report:Report){
 const counts:Record<ResultState,number>={PASS:0,FAIL:0,REVIEW:0,NOT_APPLICABLE:0,NOT_MEASURED:0,BLOCKED:0,ERROR:0};
 for(const check of report.checks)counts[resultState(check,report)]++;
 return counts;
}
export function websiteAuditSummary(pages:{status:string;report:Report|null;fetch?:{errorType?:string|null;status?:number|null}|null}[],discovered:number,selected:number){
 const completed=pages.filter(p=>p.status==='completed'&&p.report);const failed=pages.filter(p=>p.status==='failed');
 const checks:Record<ResultState,number>={PASS:0,FAIL:0,REVIEW:0,NOT_APPLICABLE:0,NOT_MEASURED:0,BLOCKED:0,ERROR:0};
 for(const page of completed){const counts=checkCounts(page.report!);for(const key of Object.keys(checks) as ResultState[])checks[key]+=counts[key];}
 const blocked=failed.filter(p=>p.fetch?.errorType==='robots'||[401,403,429].includes(p.fetch?.status??0)).length;
 return{discovered,selected,completed:completed.length,failed:failed.length,blocked,remaining:Math.max(0,selected-completed.length-failed.length),pagesWithFindings:completed.filter(p=>p.report!.checks.some(c=>c.status==='fail'||c.status==='review')).length,checks,note:'Check counts describe groups per audited page. Blocked pages are included in failed attempts, not treated as check failures.'};
}
