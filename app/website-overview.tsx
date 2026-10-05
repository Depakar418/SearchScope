'use client';
import {useState} from 'react';
import {CircleAlert,CheckCircle,Layers,TriangleAlert,ListChecks} from 'lucide-react';
import type {PageAudit} from '../lib/history';
import type {Report} from '../lib/audit';
import {websiteAuditSummary} from '../lib/audit-result';
import {currentPageAttempts,websiteFindingGroups} from '../lib/website-findings';
import {websiteScores} from '../lib/website-scores';
import {ScoreGauge} from './score-gauge';

export function WebsiteOverview({pages,discovered,selected,onOpenPage}:{pages:PageAudit[];discovered:number;selected:number;onOpenPage?:(report:Report)=>void}){
  const [filter,setFilter]=useState<'all'|'error'|'warning'>('all');
  const reports=currentPageAttempts(pages).filter(p=>p.status==='completed'&&p.report).map(p=>p.report as Report);
  const {scores,overall}=websiteScores(reports);
  const summary=websiteAuditSummary(pages,discovered,selected);
  const groups=websiteFindingGroups(pages).filter(g=>['error','warning','opportunity'].includes(g.severity));
  const visible=groups.filter(g=>filter==='all'||g.severity===filter);
  const cards=[
    {label:'Errors',value:summary.findings.errors,note:'Confirmed finding groups',detail:`${summary.findings.errorPages} affected pages`,tone:'error',Icon:CircleAlert,filter:'error' as const},
    {label:'Warnings',value:summary.findings.warnings,note:'Groups needing review',detail:`${summary.findings.warningPages} affected pages`,tone:'warning',Icon:TriangleAlert,filter:'warning' as const},
    {label:'Audited pages',value:summary.completed,note:'Successfully audited',detail:`${selected} selected · ${discovered} discovered`,tone:'pass',Icon:CheckCircle},
    {label:'Needs attention',value:summary.findings.needsAttention,note:'Actionable finding groups',detail:'Errors, warnings and opportunities',tone:'attention',Icon:ListChecks,filter:'all' as const},
    {label:'Affected pages',value:summary.findings.affectedPages,note:'Pages with actionable findings',detail:'Each page counted once',tone:'all',Icon:Layers,filter:'all' as const}
  ];
  return <section className="website-overview" aria-label="Website audit overview">
    <div className="website-overview-heading"><div><h3>Website audit overview</h3><p>Audit coverage: {summary.completed} of {discovered} discovered pages successfully audited · {selected} selected. Coverage is separate from checklist scores.</p></div><span className="website-coverage">{summary.coverage.percent===null?'No pages selected':`${summary.coverage.percent}% of selected analyzed`}</span></div>
    <div className="site-counts website-stat-cards">{cards.map(({label,value,note,detail,tone,Icon,...rest})=>{const selectedCard='filter' in rest&&filter===rest.filter;const content=<><div className="website-stat-heading"><span>{label}</span><Icon size={19}/></div><strong>{value}</strong><p>{note}</p><small>{detail}</small></>;return 'filter' in rest?<button type="button" className={'website-stat website-stat--'+tone} key={label} aria-pressed={selectedCard} onClick={()=>setFilter(rest.filter!)}>{content}</button>:<div className={'website-stat website-stat--'+tone} key={label}>{content}</div>;})}</div>
    <p className="website-score-note">{summary.coverage.discovered} discovered · {summary.coverage.selected} selected · {summary.coverage.analyzed} analyzed · {summary.coverage.failed} failed · {summary.coverage.blocked} blocked · {summary.coverage.skipped} outside selection · {summary.coverage.pending} pending. Scores use successful analyzed pages only.</p><p className="website-score-note">{summary.findings.uniqueFindingTypes} finding types · {summary.findings.affectedPages} affected pages · {summary.findings.affectedElements} distinct captured affected elements · {summary.findings.occurrences} page/check occurrences.</p><p className="website-score-note">{summary.remaining} pending · {summary.failed} failed attempts ({summary.blocked} access-limited). Failed and blocked pages have no checklist score or findings.</p>
    {!reports.length&&<p role="status">No completed page reports yet. Scores and findings will appear as pages finish.</p>}
    <div className="score-grid website-score-grid">{[{category:'Overall',score:overall,count:reports.length},...scores].map(s=><div className="score-card" key={s.category}><div><span className="score-label">{s.category==='Overall'?'Overall checklist':s.category+' checklist'}</span><div className="score-number">{s.score??'—'}{s.score!==null&&<small>/100</small>}</div><p>{s.category==='Overall'?'Average of measured categories':`${s.count} pages with a measured score`}</p></div><ScoreGauge score={s.score} category={'Website '+s.category}/></div>)}</div>
    <p className="website-score-note">Scores average measured page checklists; they do not measure rankings, traffic, indexing or AI visibility. Pending, failed and unmeasured pages are excluded.</p>
    <section className="website-finding-groups" aria-label="Website finding groups"><div className="website-finding-heading"><div><h4>Website finding groups</h4><p>{visible.length} {filter==='all'?'actionable':' '+filter} groups shown. A group is one check type and severity across current audited pages.</p></div>{filter!=='all'&&<button className="text-button" onClick={()=>setFilter('all')}>Show all groups</button>}</div>
      {visible.map(group=><details className="website-finding-group" key={group.category+group.id+group.severity}><summary><span className={'website-finding-severity '+group.severity}>{group.severity}</span><strong>{group.name}</strong><span>{group.affectedPageCount} affected {group.affectedPageCount===1?'page':'pages'}</span><span>{group.affectedElementCount===null?'Page-level or element count unavailable':`${group.affectedElementCount} identified elements`}</span></summary><div className="website-finding-pages"><p>{group.priorityReason}</p>{group.pages.map(page=><div key={page.url}><span>{page.report.title||page.url}<small>{page.url}</small></span>{onOpenPage&&<button className="text-button" onClick={()=>onOpenPage(page.report)}>View page finding</button>}</div>)}</div></details>)}
      {!visible.length&&<p className="website-score-note">No finding groups match this view. This does not establish that untested areas are issue-free.</p>}
    </section>
    <details className="website-technical-details"><summary>Technical audit details</summary><p>{summary.completed} completed pages · {summary.technical.evaluations} check evaluations (all result states) · {summary.technical.evaluatedCheckInstances} measured PASS/REVIEW/FAIL instances · {summary.remaining} pending · {summary.failed} failed ({summary.blocked} access-limited).</p><p>{summary.technical.checks.PASS} passed evaluations · {summary.technical.checks.REVIEW} review evaluations · {summary.technical.checks.FAIL} failed evaluations · {summary.technical.checks.NOT_APPLICABLE} not applicable · {summary.technical.checks.NOT_MEASURED} not measured.</p><p>Evaluations count checks on individual pages. They are not unique website problems.</p></details>
  </section>;
}
