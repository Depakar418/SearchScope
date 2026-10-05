import type {Category,Check,Report} from './audit';
import type {PageAudit} from './history';
import {currentPageAttempts,websiteFindingGroups} from './website-findings';

export type ResultState='PASS'|'FAIL'|'REVIEW'|'NOT_APPLICABLE'|'NOT_MEASURED'|'BLOCKED'|'ERROR';
const entityDependent=new Set(['alt','title-duplicates','canonical-valid','canonical-count','description-duplicates','heading-empty','heading-order','image-dimensions','image-src','anchor-text','link-href']);
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
export function websiteAuditSummary(pages:PageAudit[],discovered:number,selected:number){
 const current=currentPageAttempts(pages);const completed=current.filter(p=>p.status==='completed'&&p.report);const failed=current.filter(p=>p.status==='failed');
 const checks:Record<ResultState,number>={PASS:0,FAIL:0,REVIEW:0,NOT_APPLICABLE:0,NOT_MEASURED:0,BLOCKED:0,ERROR:0};
 for(const page of completed){const counts=checkCounts(page.report!);for(const key of Object.keys(checks) as ResultState[])checks[key]+=counts[key];}
 const blocked=failed.filter(p=>['robots','robots-blocked','restricted'].includes(p.fetch?.errorType||'')||[401,403,429].includes(p.fetch?.status??0)).length;
 const actionable=websiteFindingGroups(current).filter(g=>['error','warning','opportunity'].includes(g.severity));
 const errors=actionable.filter(g=>g.severity==='error'),warnings=actionable.filter(g=>g.severity==='warning');
 const affected=(groups:typeof actionable)=>new Set(groups.flatMap(g=>g.affectedPages)).size;
 const pending=Math.max(0,selected-completed.length-failed.length),elements=new Set(actionable.flatMap(g=>g.pages.flatMap(p=>(p.check.evidenceItems||[]).filter(e=>e.kind==='element'&&e.selector).map(e=>p.url+'|'+e.selector))));
 const coverage={discovered,selected,analyzed:completed.length,failed:failed.length-blocked,blocked,skipped:Math.max(0,discovered-selected),pending,percent:selected?Math.round(100*completed.length/selected):null,denominator:'selected pages',note:'Analyzed ÷ selected. Blocked and failed are disjoint; legacy failed includes blocked. Skipped means outside selection, not a crawler failure. Pending includes unfinished selected pages.'};
 return{discovered,selected,completed:completed.length,failed:failed.length,blocked,remaining:pending,coverage,pagesWithFindings:affected(actionable),findings:{errors:errors.length,warnings:warnings.length,needsAttention:actionable.length,uniqueFindingTypes:new Set(actionable.map(g=>g.category+':'+g.id)).size,affectedElements:elements.size,occurrences:actionable.reduce((n,g)=>n+g.pages.length,0),affectedPages:affected(actionable),errorPages:affected(errors),warningPages:affected(warnings),groups:actionable.map(g=>({id:g.id,name:g.name,category:g.category,severity:g.severity,affectedPageCount:g.affectedPageCount,affectedElementCount:g.affectedElementCount,affectedPages:g.affectedPages}))},technical:{evaluations:Object.values(checks).reduce((n,value)=>n+value,0),evaluatedCheckInstances:checks.PASS+checks.FAIL+checks.REVIEW,checksPerCurrentPage:completed.map(p=>p.report!.checks.length),checks},checks,note:'Overview findings group the same check ID, category and severity across current successful pages. Each page counts once per group. Affected-element totals count distinct extracted selectors within each group; page-level absences have no element total. Evaluations remain technical counts. Blocked attempts are failed pages, not finding errors.'};
}

/** Projection of the existing check execution; saved snapshots remain immutable. */
export function canonicalCheckResult(check:Check,report:Report){
 const state=resultState(check,report),evaluated=['PASS','REVIEW','FAIL'].includes(state),actionable=state==='FAIL'||state==='REVIEW';
 const findingType=state==='FAIL'?'ISSUE':state==='PASS'||state==='NOT_APPLICABLE'||state==='NOT_MEASURED'||check.id==='content-date'?'OBSERVATION':check.severity==='opportunity'?'OPPORTUNITY':check.confidence==='heuristic'?'RECOMMENDATION':'OBSERVATION';
 const limitation=findingLimitation(check);
 return {auditId:report.auditContext?.auditId??null,page:report.label,checkId:check.id,category:check.category,status:state,severity:check.severity,title:check.name,summary:check.evidence,explanation:check.impact,findingType,detectionConfidence:check.confidence==='observed'?'High':'Medium',confidenceMeaning:'Confidence in detecting the captured source signal, not ranking, traffic or AI selection.',limitation,where:{page:report.label,sections:[...new Set((check.evidenceItems||[]).map(e=>e.section))]},recommendation:actionable?check.fix:'Review only if relevant to the page; no verified correction is required by this result.',affectedPages:actionable?[report.label]:[],affectedElements:actionable?(check.evidenceItems||[]).filter(e=>e.kind==='element'):[],evidence:check.evidenceItems||[],fix:check.steps,verification:check.verify,confidence:check.confidence,measuredAt:report.date,engineVersion:report.version,scoreContribution:{included:evaluated,weight:evaluated?1:0,points:state==='PASS'?1:state==='REVIEW'?.5:0}};
}
export function findingLimitation(check:Check){
 const specific:Record<string,string>={alt:'Decorative intent and the relevance of alt text require human review.',title:'Nonempty source title only; clarity, relevance and the displayed search title are not measured.',h1:'The appropriate number and wording of main headings depend on the page purpose.',canonical:'A declaration does not establish the preferred URL selected by a search engine. Target verification is separately bounded.', 'canonical-valid':'Syntax and recorded HTTP outcomes do not establish the search-selected canonical.', 'canonical-count':'Resolved declaration agreement is not proof of the correct canonical.',schema:'JSON syntax and declared types do not establish eligibility, authenticity or rich-result selection.', 'content-date':'Declared date signals do not establish factual freshness; older content is not necessarily outdated.', 'content-question':'Question wording and adjacent source structure do not establish semantic answer quality.', 'content-sources':'External links do not establish factual support; unverified, blocked or timed-out requests are not broken destinations.', index:'Source directives do not establish actual indexing.',viewport:'Source device-width does not establish rendered mobile accessibility.', 'image-dimensions':'Declared dimensions or inline ratio do not measure rendered layout or CLS.'};
 return specific[check.id]||'This check describes captured initial-source signals. Rendered behavior, editorial correctness, rankings, traffic and AI visibility are not measured.';
}
export function scoreMethodology(report:Report,category:Category){
 const checks=report.checks.filter(c=>c.category===category),counts:Record<ResultState,number>={PASS:0,REVIEW:0,FAIL:0,NOT_APPLICABLE:0,NOT_MEASURED:0,BLOCKED:0,ERROR:0};
 for(const c of checks)counts[resultState(c,report)]++;
 const evaluated=counts.PASS+counts.REVIEW+counts.FAIL,points=counts.PASS+counts.REVIEW*.5;
 return {category,engineVersion:report.version,score:report.scores[category],total:checks.length,evaluated,excluded:checks.length-evaluated,points,counts,formula:'round(100 × (PASS + 0.5 × REVIEW) / evaluated checks); equal weight; unavailable results excluded',scope:'Initial-source checklist only. Rankings, actual indexing, field performance and AI citations are not measured.'};
}

export type AuditCheckResult=ReturnType<typeof canonicalCheckResult>;
